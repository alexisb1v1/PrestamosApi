import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCompanyCommand } from '../update-company.command';
import { Inject, Logger } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<
  UpdateCompanyCommand,
  Result<void, AppError>
> {
  private readonly logger = new Logger(UpdateCompanyHandler.name);

  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: UpdateCompanyCommand,
  ): Promise<Result<void, AppError>> {
    const company = await this.companyRepository.findById(command.id);
    if (!company) {
      return err('NOT_FOUND');
    }

    const oldSubdomain = company.subdomain;
    company.companyName = command.companyName;
    if (command.subdomain !== undefined) {
      company.subdomain = command.subdomain;
    }

    await this.companyRepository.update(company);

    // Si el subdominio cambió, actualizar en Redis
    if (command.subdomain && command.subdomain !== oldSubdomain) {
      try {
        const systemDomain = this.configService.get<string>('SYSTEM_DOMAIN') || 'localhost';
        
        // Eliminar llave anterior si existía
        if (oldSubdomain) {
          const oldRedisKey = `tenant:${oldSubdomain}.${systemDomain}`;
          await this.redis.del(oldRedisKey);
        }
        
        // Crear nueva llave
        const newRedisKey = `tenant:${company.subdomain}.${systemDomain}`;
        const isActive = company.status === 'ACTIVE' ? '1' : '0';
        await this.redis.set(newRedisKey, isActive);
        
        this.logger.log(`Empresa subdominio actualizado en Redis de ${oldSubdomain} a ${company.subdomain}`);
      } catch (redisError) {
        this.logger.error(`Error al actualizar Redis para subdominio ${company.subdomain}:`, redisError);
      }
    }

    return ok(undefined);
  }
}
