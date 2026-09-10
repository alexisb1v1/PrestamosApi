import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDashboardQuery } from '../get-dashboard.query';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { Result, ok } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { DashboardAppDto } from '../dto/loan-app.dto';
import { LoanMapper } from '../mappers/loan.mapper';

@QueryHandler(GetDashboardQuery)
export class GetDashboardHandler implements IQueryHandler<
  GetDashboardQuery,
  Result<DashboardAppDto, AppError>
> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  /**
   * Obtiene las estadísticas generales (Total Prestado, Cobrado, Saldo, etc.)
   * para el dashboard, filtrado por usuario y compañía.
   *
   * @param query - Parámetros de consulta:
   *   - `userId`: ID del usuario para filtrar estadísticas.
   *   - `companyId`: ID de la compañía.
   *
   * @returns `Result.ok(DashboardAppDto)` con las estadísticas calculadas.
   */
  async execute(
    query: GetDashboardQuery,
  ): Promise<Result<DashboardAppDto, AppError>> {
    const stats = await this.loanRepository.getDashboardStats(
      query.userId,
      query.companyId,
    );
    return ok(LoanMapper.toDashboardAppDto(stats));
  }
}
