import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterLoanInstallmentCommand } from '../register-loan-installment.command';
import { Inject } from '@nestjs/common';
import { LoanInstallmentRepository } from '@loans/domain/repositories/loan-installment.repository';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { LoanInstallment } from '@loans/domain/entities/loan-installment.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(RegisterLoanInstallmentCommand)
export class RegisterLoanInstallmentHandler implements ICommandHandler<
  RegisterLoanInstallmentCommand,
  Result<string, AppError>
> {
  constructor(
    @Inject(LoanInstallmentRepository)
    private readonly repository: LoanInstallmentRepository,
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  /**
   * Registra el pago de una cuota de préstamo.
   * Valida si el préstamo existe y si puede aceptar pagos (según lógica de dominio).
   * Si el pago completa el monto total, marca el préstamo como 'Liquidado'.
   *
   * @param command - Datos del pago:
   *   - `loanId`: ID del préstamo.
   *   - `amount`: Monto pagado.
   *   - `userId`: Cobrador que registra el pago.
   *   - `paymentType`: Tipo de pago (efectivo, transferencia, etc).
   *
   * @returns `Result.ok(string)` con el ID del pago registrado.
   * @returns `Result.err('NOT_FOUND')` si el préstamo no existe.
   * @returns `Result.err('INVALID_INPUT')` si el préstamo no puede aceptar pagos hoy.
   */
  async execute(
    command: RegisterLoanInstallmentCommand,
  ): Promise<Result<string, AppError>> {
    const { loanId, amount, userId, paymentType } = command;

    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      return err('NOT_FOUND');
    }

    // Delegar la validación de negocio a la Entidad de Dominio
    if (!loan.canAcceptPayment(new Date())) {
      return err('INVALID_INPUT');
    }

    const installment = new LoanInstallment(
      loanId,
      new Date(),
      amount,
      userId,
      'PAID',
      undefined,
      undefined,
      paymentType,
    );

    const installmentId = await this.repository.save(installment);

    // Verificar si el préstamo quedó liquidado
    const refreshedLoan =
      await this.loanRepository.findWithInstallments(loanId);
    if (refreshedLoan?.installments) {
      const totalPaid = refreshedLoan.installments.reduce(
        (sum, inst) => sum + inst.amount,
        0,
      );
      const totalToPay = refreshedLoan.amount + refreshedLoan.interest;
      if (totalPaid >= totalToPay) {
        refreshedLoan.status = 'Liquidado';
        await this.loanRepository.save(refreshedLoan);
      }
    }

    return ok(installmentId);
  }
}
