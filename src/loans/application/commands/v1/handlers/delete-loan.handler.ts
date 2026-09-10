import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanCommand } from '../delete-loan.command';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(DeleteLoanCommand)
export class DeleteLoanHandler implements ICommandHandler<
  DeleteLoanCommand,
  Result<void, AppError>
> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  /**
   * Cambia el estado de un préstamo a 'Eliminado'.
   *
   * @param command - Datos de la solicitud:
   *   - `loanId`: ID del préstamo a eliminar.
   *
   * @returns `Result.ok(void)` si el préstamo fue marcado como eliminado.
   * @returns `Result.err('NOT_FOUND')` si el préstamo no existe.
   */
  async execute(command: DeleteLoanCommand): Promise<Result<void, AppError>> {
    const { loanId } = command;

    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      return err('NOT_FOUND');
    }

    loan.status = 'Eliminado';
    await this.loanRepository.save(loan);
    return ok(undefined);
  }
}
