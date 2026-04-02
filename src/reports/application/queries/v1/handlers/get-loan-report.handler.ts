import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoanReportQuery } from '../get-loan-report.query';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../../loans/domain/repositories/loan.repository';
import { LoanInstallmentRepository } from '../../../../../loans/domain/repositories/loan-installment.repository';
import { ExpenseRepository } from '../../../../../expenses/domain/repositories/expense.repository';
import { Result, ok } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { LoanReportResultDto } from '../dto/loan-report-result.dto';
import { ReportMapper } from '../mappers/report.mapper';

@QueryHandler(GetLoanReportQuery)
export class GetLoanReportHandler implements IQueryHandler<GetLoanReportQuery, Result<LoanReportResultDto, AppError>> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
    @Inject(LoanInstallmentRepository)
    private readonly installmentRepository: LoanInstallmentRepository,
    @Inject(ExpenseRepository)
    private readonly expenseRepository: ExpenseRepository,
  ) {}

  async execute(query: GetLoanReportQuery): Promise<Result<LoanReportResultDto, AppError>> {
    const { startDate, endDate, companyId, userId } = query;

    const loans = await this.loanRepository.findAllInDateRange(startDate, endDate, companyId, userId);
    const installments = await this.installmentRepository.findAllInDateRange(startDate, endDate, companyId, userId);
    const expenses = await this.expenseRepository.findAllInDateRange(startDate, endDate, userId);
    const allActiveLoans = await this.loanRepository.findActiveInRange(startDate, endDate, companyId, userId);

    return ok(ReportMapper.toLoanReportResult(startDate, endDate, loans, installments, expenses, allActiveLoans));
  }
}
