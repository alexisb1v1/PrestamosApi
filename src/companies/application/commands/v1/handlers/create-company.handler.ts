import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCompanyCommand } from '../create-company.command';
import { Inject, Logger } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '@companies/domain/repositories/company.repository';
import { Company } from '@companies/domain/entities/company.entity';
import { Result, ok } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler implements ICommandHandler<
  CreateCompanyCommand,
  Result<string, AppError>
> {
  private readonly logger = new Logger(CreateCompanyHandler.name);

  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registra una nueva empresa en el sistema.
   *
   * @param command - Datos de la empresa:
   *   - `companyName`: Nombre de la nueva empresa.
   *   - `subdomain`: Subdominio de la empresa.
   *
   * @returns `Result.ok(string)` con el ID de la empresa creada.
   */
  async execute(
    command: CreateCompanyCommand,
  ): Promise<Result<string, AppError>> {
    const company = new Company(
      command.companyName,
      'ACTIVE',
      new Date(),
      undefined,
      undefined,
      command.subdomain,
    );
    const saved = await this.companyRepository.save(company);

    // Sincronizar en Redis
    try {
      const systemDomain = this.configService.get<string>('SYSTEM_DOMAIN') || 'localhost';
      const redisKey = `tenant:${saved.subdomain}.${systemDomain}`;
      await this.redis.set(redisKey, '1');
      this.logger.log(`Empresa ${saved.subdomain} sincronizada en Redis como activa (1)`);
    } catch (redisError) {
      this.logger.error(
        `Error al sincronizar la empresa ${saved.subdomain} en Redis:`,
        redisError,
      );
    }

    return ok(saved.id!);
  }
}
