import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDashboardQuery } from '../get-dashboard.query';
import { Inject } from '@nestjs/common';
import {
  LoanRepository,
  DashboardStats,
} from '../../../../domain/repositories/loan.repository';

@QueryHandler(GetDashboardQuery)
export class GetDashboardHandler implements IQueryHandler<
  GetDashboardQuery,
  DashboardStats
> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(query: GetDashboardQuery): Promise<DashboardStats> {
    return await this.loanRepository.getDashboardStats(
      query.userId,
      query.companyId,
    );
  }
}
