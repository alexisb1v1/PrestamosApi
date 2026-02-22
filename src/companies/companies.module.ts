import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from './infrastructure/repositories/entities/company.entity';
import { PostgresCompanyRepository } from './infrastructure/repositories/postgres-company.repository';
import { CompanyRepositoryToken } from './domain/repositories/company.repository';

// Command Handlers
import { CreateCompanyHandler } from './application/commands/v1/handlers/create-company.handler';
import { UpdateCompanyHandler } from './application/commands/v1/handlers/update-company.handler';
import { DeactivateCompanyHandler } from './application/commands/v1/handlers/deactivate-company.handler';

// Query Handlers
import { ListCompaniesHandler } from './application/queries/v1/handlers/list-companies.handler';

// Controllers
import { CreateCompanyController } from './interfaces/http/v1/create-company/create-company.controller';
import { UpdateCompanyController } from './interfaces/http/v1/update-company/update-company.controller';
import { DeactivateCompanyController } from './interfaces/http/v1/deactivate-company/deactivate-company.controller';
import { ListCompaniesController } from './interfaces/http/v1/list-companies/list-companies.controller';

const CommandHandlers = [
  CreateCompanyHandler,
  UpdateCompanyHandler,
  DeactivateCompanyHandler,
];

const QueryHandlers = [ListCompaniesHandler];

const Controllers = [
  CreateCompanyController,
  UpdateCompanyController,
  DeactivateCompanyController,
  ListCompaniesController,
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
export class CompaniesModule {}
