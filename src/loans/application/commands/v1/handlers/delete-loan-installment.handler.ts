import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanInstallmentCommand } from '../delete-loan-installment.command';
import { Inject } from '@nestjs/common';
import { LoanInstallmentRepository } from '@loans/domain/repositories/loan-installment.repository';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(DeleteLoanInstallmentCommand)
export class DeleteLoanInstallmentHandler implements ICommandHandler<
  DeleteLoanInstallmentCommand,
  Result<void, AppError>
> {
  constructor(
    @Inject(LoanInstallmentRepository)
    private readonly repository: LoanInstallmentRepository,
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  /**
   * Elimina el registro de un pago (cuota).
   * Si el préstamo estaba 'Liquidado' y tras la eliminación el saldo vuelve a ser positivo,
   * el préstamo regresa al estado 'Activo'.
   *
   * @param command - Datos de la solicitud:
   *   - `installmentId`: ID del pago a eliminar.
   *
   * @returns `Result.ok(void)` si la eliminación fue exitosa.
   * @returns `Result.err('NOT_FOUND')` si el pago no existe.
   */
  async execute(
    command: DeleteLoanInstallmentCommand,
  ): Promise<Result<void, AppError>> {
    const { installmentId } = command;

    const installment = await this.repository.findById(installmentId);
    if (!installment) {
      return err('NOT_FOUND');
    }

    const loanId = installment.loanId;
    await this.repository.delete(installmentId);

    // Verificar si el préstamo debe volver a 'Activo'
    const refreshedLoan =
      await this.loanRepository.findWithInstallments(loanId);
    if (refreshedLoan?.status === 'Liquidado') {
      const totalPaid =
        refreshedLoan.installments?.reduce(
          (sum, inst) => sum + inst.amount,
          0,
        ) || 0;
      const totalToPay = refreshedLoan.amount + refreshedLoan.interest;
      if (totalPaid < totalToPay) {
        refreshedLoan.status = 'Activo';
        await this.loanRepository.save(refreshedLoan);
      }
    }

    return ok(undefined);
  }
}
