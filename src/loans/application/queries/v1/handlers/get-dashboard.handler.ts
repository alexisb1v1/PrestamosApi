import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDashboardQuery } from '../get-dashboard.query';
import { Inject } from '@nestjs/common';
import {
  LoanRepository,
  DashboardStats,
} from '../../../../domain/repositories/loan.repository';
import { Result, ok } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { DashboardAppDto } from '../dto/loan-app.dto';
import { LoanMapper } from '../mappers/loan.mapper';

@QueryHandler(GetDashboardQuery)
export class GetDashboardHandler implements IQueryHandler<GetDashboardQuery, Result<DashboardAppDto, AppError>> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(query: GetDashboardQuery): Promise<Result<DashboardAppDto, AppError>> {
    const stats = await this.loanRepository.getDashboardStats(query.userId, query.companyId);
    return ok(LoanMapper.toDashboardAppDto(stats));
  }
}
