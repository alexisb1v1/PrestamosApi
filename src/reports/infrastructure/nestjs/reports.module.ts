import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoansModule } from '@loans/infrastructure/nestjs/loans.module';
import { ExpensesModule } from '@expenses/infrastructure/nestjs/expenses.module';
import { GetLoanReportAction } from '@reports/interfaces/http/v1/report/actions/get-loan-report.action';
import { GetLoanReportHandler } from '@reports/application/queries/v1/handlers/get-loan-report.handler';

@Module({
  imports: [CqrsModule, LoansModule, ExpensesModule],
  controllers: [GetLoanReportAction],
  providers: [GetLoanReportHandler],
})
export class ReportsModule {}
