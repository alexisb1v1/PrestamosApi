import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoanDetailsQuery } from '../get-loan-details.query';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { LoanAppDto } from '../dto/loan-app.dto';
import { LoanMapper } from '../mappers/loan.mapper';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@QueryHandler(GetLoanDetailsQuery)
export class GetLoanDetailsHandler implements IQueryHandler<
  GetLoanDetailsQuery,
  Result<LoanAppDto, AppError>
> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  /**
   * Obtiene la información detallada de un préstamo, incluyendo su historial de cuotas.
   *
   * @param query - Parámetros de consulta:
   *   - `loanId`: ID del préstamo a consultar.
   *
   * @returns `Result.ok(LoanAppDto)` con los detalles del préstamo y sus cuotas.
   * @returns `Result.err('NOT_FOUND')` si el préstamo no existe.
   */
  async execute(
    query: GetLoanDetailsQuery,
  ): Promise<Result<LoanAppDto, AppError>> {
    const loan = await this.loanRepository.findWithInstallments(query.loanId);
    if (!loan) {
      return err('NOT_FOUND');
    }
    return ok(LoanMapper.toLoanAppDto(loan));
  }
}
