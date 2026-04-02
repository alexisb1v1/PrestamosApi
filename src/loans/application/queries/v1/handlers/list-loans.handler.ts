import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListLoansQuery } from '../list-loans.query';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { LoanAppDto } from '../dto/loan-app.dto';
import { LoanMapper } from '../mappers/loan.mapper';
import { Result, ok } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@QueryHandler(ListLoansQuery)
export class ListLoansHandler implements IQueryHandler<ListLoansQuery, Result<LoanAppDto[], AppError>> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) { }

  async execute(query: ListLoansQuery): Promise<Result<LoanAppDto[], AppError>> {
    const loans = await this.loanRepository.findAllWithFilters(
      query.isLiquidated,
      query.userId,
      query.searchQuery,
      query.companyId,
    );
    return ok(loans.map(l => LoanMapper.toLoanAppDto(l)));
  }
}
