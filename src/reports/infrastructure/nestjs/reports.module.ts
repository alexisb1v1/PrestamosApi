import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoansModule } from '../../../loans/infrastructure/nestjs/loans.module';
import { ExpensesModule } from '../../../expenses/infrastructure/nestjs/expenses.module';
import { ReportController } from '../../interfaces/http/v1/report/report.controller';
import { GetLoanReportHandler } from '../../application/queries/v1/handlers/get-loan-report.handler';

@Module({
    imports: [CqrsModule, LoansModule, ExpensesModule],
    controllers: [ReportController],
    providers: [GetLoanReportHandler],
})
export class ReportsModule { }
