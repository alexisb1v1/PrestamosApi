import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from '@companies/infrastructure/repositories/entities/company.entity';
import { PostgresCompanyRepository } from '@companies/infrastructure/repositories/postgres-company.repository';
import { CompanyRepositoryToken } from '@companies/domain/repositories/company.repository';

// Command Handlers
import { CreateCompanyHandler } from '@companies/application/commands/v1/handlers/create-company.handler';
import { UpdateCompanyHandler } from '@companies/application/commands/v1/handlers/update-company.handler';
import { UpdateCompanyStatusHandler } from '@companies/application/commands/v1/handlers/update-company-status.handler';

// Query Handlers
import { ListCompaniesHandler } from '@companies/application/queries/v1/handlers/list-companies.handler';
import { VerifyCompanyDomainHandler } from '@companies/application/queries/v1/handlers/verify-company-domain.handler';

// Actions (Granular Controllers)
import { CreateCompanyAction } from '@companies/interfaces/http/v1/company/actions/create-company.action';
import { ListCompaniesAction } from '@companies/interfaces/http/v1/company/actions/list-companies.action';
import { UpdateCompanyAction } from '@companies/interfaces/http/v1/company/actions/update-company.action';
import { UpdateCompanyStatusAction } from '@companies/interfaces/http/v1/company/actions/update-company-status.action';
import { VerifyCompanyDomainAction } from '@companies/interfaces/http/v1/company/actions/verify-company-domain.action';

import { RedisModule } from '@shared/redis/redis.module';

const CommandHandlers = [
  CreateCompanyHandler,
  UpdateCompanyHandler,
  UpdateCompanyStatusHandler,
];

const QueryHandlers = [ListCompaniesHandler, VerifyCompanyDomainHandler];

const Controllers = [
  CreateCompanyAction,
  ListCompaniesAction,
  UpdateCompanyAction,
  UpdateCompanyStatusAction,
  VerifyCompanyDomainAction,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([CompanyEntity]),
    RedisModule,
  ],
  controllers: Controllers,
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: CompanyRepositoryToken,
      useClass: PostgresCompanyRepository,
    },
  ],
  exports: [CompanyRepositoryToken],
})
export class CompaniesModule {}
