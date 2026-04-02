import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanInstallmentCommand } from '../delete-loan-installment.command';
import { Inject } from '@nestjs/common';
import { LoanInstallmentRepository } from '../../../../domain/repositories/loan-installment.repository';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(DeleteLoanInstallmentCommand)
export class DeleteLoanInstallmentHandler
  implements ICommandHandler<DeleteLoanInstallmentCommand, Result<void, AppError>>
{
  constructor(
    @Inject(LoanInstallmentRepository)
    private readonly repository: LoanInstallmentRepository,
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(command: DeleteLoanInstallmentCommand): Promise<Result<void, AppError>> {
    const { installmentId } = command;

    const installment = await this.repository.findById(installmentId);
    if (!installment) {
      return err('NOT_FOUND');
    }

    const loanId = installment.loanId;
    await this.repository.delete(installmentId);

    // Verificar si el préstamo debe volver a 'Activo'
    const refreshedLoan = await this.loanRepository.findWithInstallments(loanId);
    if (refreshedLoan?.status === 'Liquidado') {
      const totalPaid = refreshedLoan.installments?.reduce((sum, inst) => sum + inst.amount, 0) || 0;
      const totalToPay = refreshedLoan.amount + refreshedLoan.interest;
      if (totalPaid < totalToPay) {
        refreshedLoan.status = 'Activo';
        await this.loanRepository.save(refreshedLoan);
      }
    }

    return ok(undefined);
  }
}
