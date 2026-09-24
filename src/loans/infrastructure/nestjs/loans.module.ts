import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
// Actions (Granular Controllers)
import { CreateLoanAction } from '@loans/interfaces/http/v1/loan/actions/create-loan.action';
import { ListLoansAction } from '@loans/interfaces/http/v1/loan/actions/list-loans.action';
import { GetLoanDetailsAction } from '@loans/interfaces/http/v1/loan/actions/get-loan-details.action';
import { ReassignLoanAction } from '@loans/interfaces/http/v1/loan/actions/reassign-loan.action';
import { UpdateLoanInfoAction } from '@loans/interfaces/http/v1/loan/actions/update-loan-info.action';
import { DeleteLoanAction } from '@loans/interfaces/http/v1/loan/actions/delete-loan.action';
import { RegisterInstallmentAction } from '@loans/interfaces/http/v1/installment/actions/register-installment.action';
import { DeleteInstallmentAction } from '@loans/interfaces/http/v1/installment/actions/delete-installment.action';
import { GetDashboardAction } from '@loans/interfaces/http/v1/dashboard/actions/get-dashboard.action';
import { GenerateShareLinkAction } from '@loans/interfaces/http/v1/loan/actions/generate-share-link.action';
import { GetPublicLoanDetailsAction } from '@loans/interfaces/http/v1/loan/actions/get-public-loan-details.action';
// Handlers
import { CreateLoanHandler } from '@loans/application/commands/v1/handlers/create-loan.handler';
import { ListLoansHandler } from '@loans/application/queries/v1/handlers/list-loans.handler';
import { RegisterLoanInstallmentHandler } from '@loans/application/commands/v1/handlers/register-loan-installment.handler';
import { GetLoanDetailsHandler } from '@loans/application/queries/v1/handlers/get-loan-details.handler';
import { GetDashboardHandler } from '@loans/application/queries/v1/handlers/get-dashboard.handler';
import { DeleteLoanInstallmentHandler } from '@loans/application/commands/v1/handlers/delete-loan-installment.handler';
import { ReassignLoanHandler } from '@loans/application/commands/v1/handlers/reassign-loan.handler';
import { DeleteLoanHandler } from '@loans/application/commands/v1/handlers/delete-loan.handler';
import { UpdateLoanInfoHandler } from '@loans/application/commands/v1/handlers/update-loan-info.handler';

import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { LoanInstallmentRepository } from '@loans/domain/repositories/loan-installment.repository';
import { PostgresLoanRepository } from '../repositories/postgres-loan.repository';
import { PostgresLoanInstallmentRepository } from '../repositories/postgres-loan-installment.repository';
import { LoanEntity } from '../repositories/entities/loan.entity';
import { LoanInstallmentEntity } from '../repositories/entities/loan-installment.entity';
import { UsersModule } from '@users/infrastructure/nestjs/users.module';
import { RolesGuard } from '@users/infrastructure/security/roles.guard';

import { CreditScoreCronService } from '@loans/application/services/credit-score-cron.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([LoanEntity, LoanInstallmentEntity]),
    UsersModule,
  ],
  controllers: [
    CreateLoanAction,
    ListLoansAction,
    GetLoanDetailsAction,
    ReassignLoanAction,
    UpdateLoanInfoAction,
    DeleteLoanAction,
    RegisterInstallmentAction,
    DeleteInstallmentAction,
    GetDashboardAction,
    GenerateShareLinkAction,
    GetPublicLoanDetailsAction,
  ],
  providers: [
    CreateLoanHandler,
    ListLoansHandler,
    RegisterLoanInstallmentHandler,
    GetLoanDetailsHandler,
    GetDashboardHandler,
    DeleteLoanInstallmentHandler,
    ReassignLoanHandler,
    DeleteLoanHandler,
    UpdateLoanInfoHandler,
    RolesGuard,
    CreditScoreCronService,
    {
      provide: LoanRepository,
      useClass: PostgresLoanRepository,
    },
    {
      provide: LoanInstallmentRepository,
      useClass: PostgresLoanInstallmentRepository,
    },
  ],
  exports: [LoanRepository, LoanInstallmentRepository],
})
export class LoansModule {}
