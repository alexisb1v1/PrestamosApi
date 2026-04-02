import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterLoanInstallmentCommand } from '../register-loan-installment.command';
import { Inject } from '@nestjs/common';
import { LoanInstallmentRepository } from '../../../../domain/repositories/loan-installment.repository';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { LoanInstallment } from '../../../../domain/entities/loan-installment.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(RegisterLoanInstallmentCommand)
export class RegisterLoanInstallmentHandler
  implements ICommandHandler<RegisterLoanInstallmentCommand, Result<string, AppError>>
{
  constructor(
    @Inject(LoanInstallmentRepository)
    private readonly repository: LoanInstallmentRepository,
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(command: RegisterLoanInstallmentCommand): Promise<Result<string, AppError>> {
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
    const refreshedLoan = await this.loanRepository.findWithInstallments(loanId);
    if (refreshedLoan?.installments) {
      const totalPaid = refreshedLoan.installments.reduce((sum, inst) => sum + inst.amount, 0);
      const totalToPay = refreshedLoan.amount + refreshedLoan.interest;
      if (totalPaid >= totalToPay) {
        refreshedLoan.status = 'Liquidado';
        await this.loanRepository.save(refreshedLoan);
      }
    }

    return ok(installmentId);
  }
}
