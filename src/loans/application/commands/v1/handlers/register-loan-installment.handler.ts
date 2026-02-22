import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterLoanInstallmentCommand } from '../register-loan-installment.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { LoanInstallmentRepository } from '../../../../domain/repositories/loan-installment.repository';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { LoanInstallment } from '../../../../domain/entities/loan-installment.entity';

@CommandHandler(RegisterLoanInstallmentCommand)
export class RegisterLoanInstallmentHandler implements ICommandHandler<RegisterLoanInstallmentCommand> {
  constructor(
    @Inject(LoanInstallmentRepository)
    private readonly repository: LoanInstallmentRepository,
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(command: RegisterLoanInstallmentCommand): Promise<string> {
    const { loanId, amount, userId, paymentType } = command;

    // 1. Fetch loan to check creation date
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throw new HttpException('Préstamo no encontrado', HttpStatus.NOT_FOUND);
    }
    // 2. Validate if current date is within the payment interval
    if (loan.inIntervalPayment === 0) {
      throw new HttpException(
        'No se pueden registrar abonos fuera del intervalo de fechas del préstamo (Inicio - Fin).',
        HttpStatus.BAD_REQUEST,
      );
    }

    const installment = new LoanInstallment(
      loanId,
      new Date(),
      amount,
      userId,
      'PAID',
      undefined, // id
      undefined, // userName
      paymentType,
    );

    const installmentId = await this.repository.save(installment);

    // Check if the loan is fully paid to update its status
    const refreshedLoan =
      await this.loanRepository.findWithInstallments(loanId);
    if (refreshedLoan && refreshedLoan.installments) {
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

    return installmentId;
  }
}
