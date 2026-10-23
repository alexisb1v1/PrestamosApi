import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshCompanyKeyTokenCommand } from '../refresh-company-key-token.command';
import { Inject, Logger } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { Redis } from 'ioredis';
import { randomBytes } from 'crypto';

export interface RefreshCompanyKeyTokenResult {
  companyId: string;
  newKeyToken: string;
}

@CommandHandler(RefreshCompanyKeyTokenCommand)
export class RefreshCompanyKeyTokenHandler implements ICommandHandler<
  RefreshCompanyKeyTokenCommand,
  Result<RefreshCompanyKeyTokenResult, AppError>
> {
  private readonly logger = new Logger(RefreshCompanyKeyTokenHandler.name);

  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async execute(
    command: RefreshCompanyKeyTokenCommand,
  ): Promise<Result<RefreshCompanyKeyTokenResult, AppError>> {
    const company = await this.companyRepository.findById(command.companyId);
    if (!company) {
      return err('NOT_FOUND');
    }

    // 1. Generar nuevo key_token criptográfico aleatorio
    const newKeyToken = `cmp_${randomBytes(16).toString('hex')}`;
    const oldKeyToken = company.keyToken;
    company.keyToken = newKeyToken;

    // 2. Persistir únicamente el cambio en PostgreSQL
    await this.companyRepository.update(company);

    // 3. Invalidar la caché de autenticación del tenant en Redis (Kill-Switch)
    try {
      const redisKey = `neocobros:tenant:auth:${company.id}`;
      await this.redis.del(redisKey);
      this.logger.log(`Caché de autenticación invalidada en Redis para el tenant: ${redisKey}`);
    } catch (redisError) {
      this.logger.error(
        `Error al invalidar caché en Redis para empresa ${company.id}:`,
        redisError,
      );
    }

    this.logger.warn(
      `[KILL-SWITCH] KeyToken rotado para empresa "${company.companyName}" (ID: ${company.id}). Token anterior: ${oldKeyToken ? oldKeyToken.substring(0, 8) + '...' : 'ninguno'}. Nuevo: ${newKeyToken.substring(0, 8) + '...'}. Todas las sesiones activas han sido revocadas.`,
    );

    return ok({
      companyId: company.id!,
      newKeyToken: company.keyToken,
    });
  }
}
