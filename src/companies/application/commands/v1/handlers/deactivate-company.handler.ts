import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeactivateCompanyCommand } from '../deactivate-company.command';
import { Inject, Logger } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@CommandHandler(DeactivateCompanyCommand)
export class DeactivateCompanyHandler implements ICommandHandler<
  DeactivateCompanyCommand,
  Result<void, AppError>
> {
  private readonly logger = new Logger(DeactivateCompanyHandler.name);

  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: DeactivateCompanyCommand,
  ): Promise<Result<void, AppError>> {
    const company = await this.companyRepository.findById(command.id);
    if (!company) {
      return err('NOT_FOUND');
    }

    company.status = 'INACTIVE';
    await this.companyRepository.update(company);

    // Sincronizar en Redis
    if (company.subdomain) {
      try {
        const systemDomain = this.configService.get<string>('SYSTEM_DOMAIN') || 'localhost';
        const redisKey = `tenant:${company.subdomain}.${systemDomain}`;
        await this.redis.set(redisKey, '0');
        this.logger.log(`Empresa ${company.subdomain} sincronizada en Redis como inactiva (0)`);
      } catch (redisError) {
        this.logger.error(
          `Error al desactivar la empresa ${company.subdomain} en Redis:`,
          redisError,
        );
      }
    }

    return ok(undefined);
  }
}
