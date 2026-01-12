import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateLoanController } from '../../interfaces/http/v1/create-loan/create-loan.controller';
import { ListLoansController } from '../../interfaces/http/v1/list-loans/list-loans.controller';
import { RegisterLoanInstallmentController } from '../../interfaces/http/v1/register-loan-installment/register-loan-installment.controller';
import { GetLoanDetailsController } from '../../interfaces/http/v1/get-loan-details/get-loan-details.controller';
import { CreateLoanHandler } from '../../application/commands/v1/handlers/create-loan.handler';
import { ListLoansHandler } from '../../application/queries/v1/handlers/list-loans.handler';
import { RegisterLoanInstallmentHandler } from '../../application/commands/v1/handlers/register-loan-installment.handler';
import { GetLoanDetailsHandler } from '../../application/queries/v1/handlers/get-loan-details.handler';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { LoanInstallmentRepository } from '../../domain/repositories/loan-installment.repository';
import { PostgresLoanRepository } from '../repositories/postgres-loan.repository';
import { PostgresLoanInstallmentRepository } from '../repositories/postgres-loan-installment.repository';
import { LoanEntity } from '../repositories/entities/loan.entity';
import { LoanInstallmentEntity } from '../repositories/entities/loan-installment.entity';
import { UsersModule } from '../../../users/infrastructure/nestjs/users.module';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([LoanEntity, LoanInstallmentEntity]),
        UsersModule,
    ],
    controllers: [
        CreateLoanController,
        ListLoansController,
        RegisterLoanInstallmentController,
        GetLoanDetailsController,
    ],
    providers: [
        CreateLoanHandler,
        ListLoansHandler,
        RegisterLoanInstallmentHandler,
        GetLoanDetailsHandler,
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
export class LoansModule { }
