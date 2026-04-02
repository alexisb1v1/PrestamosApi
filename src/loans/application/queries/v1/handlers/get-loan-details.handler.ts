import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoanDetailsQuery } from '../get-loan-details.query';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { LoanAppDto } from '../dto/loan-app.dto';
import { LoanMapper } from '../mappers/loan.mapper';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@QueryHandler(GetLoanDetailsQuery)
export class GetLoanDetailsHandler implements IQueryHandler<GetLoanDetailsQuery, Result<LoanAppDto, AppError>> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(query: GetLoanDetailsQuery): Promise<Result<LoanAppDto, AppError>> {
    const loan = await this.loanRepository.findWithInstallments(query.loanId);
    if (!loan) {
      return err('NOT_FOUND');
    }
    return ok(LoanMapper.toLoanAppDto(loan));
  }
}
