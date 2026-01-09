import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateLoanController } from '../../interfaces/http/v1/create-loan/create-loan.controller';
import { CreateLoanHandler } from '../../application/commands/v1/handlers/create-loan.handler';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { PostgresLoanRepository } from '../repositories/postgres-loan.repository';
import { LoanEntity } from '../repositories/entities/loan.entity';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([LoanEntity]),
    ],
    controllers: [CreateLoanController],
    providers: [
        CreateLoanHandler,
        {
            provide: LoanRepository,
            useClass: PostgresLoanRepository,
        },
    ],
    exports: [LoanRepository],
})
export class LoansModule { }
