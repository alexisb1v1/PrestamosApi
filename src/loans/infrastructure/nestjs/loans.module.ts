import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
// Controllers
import { LoanController } from '../../interfaces/http/v1/loan/loan.controller';
import { InstallmentController } from '../../interfaces/http/v1/installment/installment.controller';
import { DashboardController } from '../../interfaces/http/v1/dashboard/dashboard.controller';
// Handlers
import { CreateLoanHandler } from '../../application/commands/v1/handlers/create-loan.handler';
import { ListLoansHandler } from '../../application/queries/v1/handlers/list-loans.handler';
import { RegisterLoanInstallmentHandler } from '../../application/commands/v1/handlers/register-loan-installment.handler';
import { GetLoanDetailsHandler } from '../../application/queries/v1/handlers/get-loan-details.handler';
import { GetDashboardHandler } from '../../application/queries/v1/handlers/get-dashboard.handler';
import { DeleteLoanInstallmentHandler } from '../../application/commands/v1/handlers/delete-loan-installment.handler';
import { ReassignLoanHandler } from '../../application/commands/v1/handlers/reassign-loan.handler';
import { DeleteLoanHandler } from '../../application/commands/v1/handlers/delete-loan.handler';

import { LoanRepository } from '../../domain/repositories/loan.repository';
import { LoanInstallmentRepository } from '../../domain/repositories/loan-installment.repository';
import { PostgresLoanRepository } from '../repositories/postgres-loan.repository';
import { PostgresLoanInstallmentRepository } from '../repositories/postgres-loan-installment.repository';
import { LoanEntity } from '../repositories/entities/loan.entity';
import { LoanInstallmentEntity } from '../repositories/entities/loan-installment.entity';
import { UsersModule } from '../../../users/infrastructure/nestjs/users.module';
import { RolesGuard } from '../../../users/infrastructure/security/roles.guard';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([LoanEntity, LoanInstallmentEntity]),
    UsersModule,
  ],
  controllers: [
    LoanController,
    InstallmentController,
    DashboardController,
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
    RolesGuard,
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
