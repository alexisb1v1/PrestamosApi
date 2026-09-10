import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListLoansQuery } from '../list-loans.query';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { LoanAppDto } from '../dto/loan-app.dto';
import { LoanMapper } from '../mappers/loan.mapper';
import { Result, ok } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@QueryHandler(ListLoansQuery)
export class ListLoansHandler implements IQueryHandler<
  ListLoansQuery,
  Result<LoanAppDto[], AppError>
> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  /**
   * Lista los préstamos filtrando por estado de liquidación, usuario responsable,
   * término de búsqueda y compañía.
   *
   * @param query - Filtros de búsqueda:
   *   - `isLiquidated`: Filtrar por liquidados o activos.
   *   - `userId`: Filtrar por cobrador responsable.
   *   - `searchQuery`: Texto de búsqueda (nombre, documento, etc).
   *   - `companyId`: ID de la compañía vinculada.
   *
   * @returns `Result.ok(LoanAppDto[])` con la lista de préstamos que cumplen los criterios.
   */
  async execute(
    query: ListLoansQuery,
  ): Promise<Result<LoanAppDto[], AppError>> {
    const loans = await this.loanRepository.findAllWithFilters(
      query.isLiquidated,
      query.userId,
      query.searchQuery,
      query.companyId,
    );
    return ok(loans.map((l) => LoanMapper.toLoanAppDto(l)));
  }
}
