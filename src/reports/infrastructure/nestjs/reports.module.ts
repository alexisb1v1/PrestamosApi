import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoansModule } from '@loans/infrastructure/nestjs/loans.module';
import { ExpensesModule } from '@expenses/infrastructure/nestjs/expenses.module';
import { GetLoanReportAction } from '@reports/interfaces/http/v1/report/actions/get-loan-report.action';
import { GetLoanReportHandler } from '@reports/application/queries/v1/handlers/get-loan-report.handler';
import { GetAdvancedReportsAction } from '@reports/interfaces/http/v1/report/actions/get-advanced-reports.action';
import { AdvancedReportHandlers } from '@reports/application/queries/v1/handlers/advanced-reports.handlers';

@Module({
  imports: [CqrsModule, LoansModule, ExpensesModule],
  controllers: [GetLoanReportAction, GetAdvancedReportsAction],
  providers: [GetLoanReportHandler, ...AdvancedReportHandlers],
})
export class ReportsModule {}
