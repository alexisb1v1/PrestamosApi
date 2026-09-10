import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCompanyStatusCommand } from '../update-company-status.command';
import { Inject, Logger } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@CommandHandler(UpdateCompanyStatusCommand)
export class UpdateCompanyStatusHandler implements ICommandHandler<
  UpdateCompanyStatusCommand,
  Result<void, AppError>
> {
  private readonly logger = new Logger(UpdateCompanyStatusHandler.name);

  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: UpdateCompanyStatusCommand,
  ): Promise<Result<void, AppError>> {
    const company = await this.companyRepository.findById(command.id);
    if (!company) {
      return err('NOT_FOUND');
    }

    const newStatus = command.status.toUpperCase();
    company.status = newStatus;
    await this.companyRepository.update(company);

    // Sincronizar en Redis
    if (company.subdomain) {
      try {
        const systemDomain = this.configService.get<string>('SYSTEM_DOMAIN') || 'localhost';
        const redisKey = `tenant:${company.subdomain}.${systemDomain}`;
        // En Redis guardamos '1' para ACTIVE/ACTIVO y '0' para cualquier otro estado
        const normalizedStatus = company.getNormalizedStatus();
        const redisValue = normalizedStatus === 'ACTIVE' ? '1' : '0';
        await this.redis.set(redisKey, redisValue);
        this.logger.log(
          `Estado de empresa ${company.subdomain} sincronizado en Redis con valor ${redisValue} (${normalizedStatus})`,
        );
      } catch (redisError) {
        this.logger.error(
          `Error al sincronizar el estado de la empresa ${company.subdomain} en Redis:`,
          redisError,
        );
      }
    }

    return ok(undefined);
  }
}
