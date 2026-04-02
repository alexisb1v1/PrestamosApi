import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from './infrastructure/repositories/entities/company.entity';
import { PostgresCompanyRepository } from './infrastructure/repositories/postgres-company.repository';
import { CompanyRepositoryToken } from './domain/repositories/company.repository';

// Command Handlers
import { CreateCompanyHandler } from './application/commands/v1/handlers/create-company.handler';
import { UpdateCompanyHandler } from './application/commands/v1/handlers/update-company.handler';
import { UpdateCompanyStatusHandler } from './application/commands/v1/handlers/update-company-status.handler';

// Query Handlers
import { ListCompaniesHandler } from './application/queries/v1/handlers/list-companies.handler';

// Controllers
import { CompanyController } from './interfaces/http/v1/company/company.controller';

const CommandHandlers = [
  CreateCompanyHandler,
  UpdateCompanyHandler,
  UpdateCompanyStatusHandler,
];

const QueryHandlers = [ListCompaniesHandler];

const Controllers = [
  CompanyController,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CompanyEntity])],
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
export class CompaniesModule { }
