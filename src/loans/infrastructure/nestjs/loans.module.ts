import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateLoanController } from '../../interfaces/http/v1/create-loan/create-loan.controller';
import { ListLoansController } from '../../interfaces/http/v1/list-loans/list-loans.controller';
import { CreateLoanHandler } from '../../application/commands/v1/handlers/create-loan.handler';
import { ListLoansHandler } from '../../application/queries/v1/handlers/list-loans.handler';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { PostgresLoanRepository } from '../repositories/postgres-loan.repository';
import { LoanEntity } from '../repositories/entities/loan.entity';
import { UsersModule } from '../../../users/infrastructure/nestjs/users.module';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([LoanEntity]),
        UsersModule,
    ],
    controllers: [
        CreateLoanController,
        ListLoansController,
    ],
    providers: [
        CreateLoanHandler,
        ListLoansHandler,
        {
            provide: LoanRepository,
            useClass: PostgresLoanRepository,
        },
    ],
    exports: [LoanRepository],
})
export class LoansModule { }
