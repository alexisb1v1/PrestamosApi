import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { VerifyCompanyDomainQuery } from '../verify-company-domain.query';
import { CompanyRepository, CompanyRepositoryToken } from '@companies/domain/repositories/company.repository';
import { AppError } from '@shared/errors/app-errors';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@QueryHandler(VerifyCompanyDomainQuery)
export class VerifyCompanyDomainHandler implements IQueryHandler<VerifyCompanyDomainQuery, Result<void, AppError>> {
  private readonly logger = new Logger(VerifyCompanyDomainHandler.name);

  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async execute(query: VerifyCompanyDomainQuery): Promise<Result<void, AppError>> {
    const { fullDomain } = query;

    // 1. Extraemos el subdominio (la parte antes del primer punto)
    const subdomain = fullDomain.split('.')[0];

    if (!subdomain) {
      return err('NOT_FOUND');
    }

    // 2. Consultamos a la base de datos
    const company = await this.companyRepository.findBySubdomain(subdomain);

    if (!company) {
      return err('NOT_FOUND');
    }

    // 3. Verificamos si está activa
    if (company.status !== 'ACTIVE') {
      return err('FORBIDDEN');
    }

    // 4. (Self-Healing) Reconstruimos la caché de Redis para este subdominio
    try {
      const systemDomain = this.configService.get<string>('SYSTEM_DOMAIN') || 'localhost';
      const redisKey = `tenant:${subdomain}.${systemDomain}`;
      await this.redis.set(redisKey, '1');
      this.logger.log(`[Self-Healing] Empresa ${subdomain} restaurada en Redis automáticamente`);
    } catch (redisError) {
      this.logger.error(`Error al restaurar el subdominio ${subdomain} en Redis:`, redisError);
    }

    return ok(undefined);
  }
}
