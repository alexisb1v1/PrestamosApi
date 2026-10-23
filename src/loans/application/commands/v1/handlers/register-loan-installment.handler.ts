import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterLoanInstallmentCommand } from '../register-loan-installment.command';
import { Inject } from '@nestjs/common';
import { LoanInstallmentRepository } from '@loans/domain/repositories/loan-installment.repository';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { LoanInstallment } from '@loans/domain/entities/loan-installment.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { CreditScoreCronService } from '@loans/application/services/credit-score-cron.service';
import { calculateLoanLiquidationIndicators } from '@loans/application/utils/workdays.util';

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
    private readonly creditScoreService: CreditScoreCronService,
  ) {}

  async execute(
    command: RegisterLoanInstallmentCommand,
  ): Promise<Result<string, AppError>> {
    const { loanId, amount, userId, paymentType } = command;

    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      return err('NOT_FOUND');
    }

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

    const refreshedLoan =
      await this.loanRepository.findWithInstallments(loanId);
    if (refreshedLoan?.installments) {
      const totalPaid = refreshedLoan.installments.reduce(
        (sum, inst) => sum + inst.amount,
        0,
      );
      const totalToPay = refreshedLoan.amount + refreshedLoan.interest;
      if (totalPaid >= totalToPay) {
        const indicators = calculateLoanLiquidationIndicators(
          refreshedLoan.startDate,
          refreshedLoan.endDate,
          new Date(),
        );

        refreshedLoan.status = 'Liquidado';
        refreshedLoan.liquidationDate = new Date();
        refreshedLoan.completedOnTime = indicators.completedOnTime;
        refreshedLoan.earlyLiquidationDays = indicators.earlyLiquidationDays;
        refreshedLoan.extensionDays = indicators.extensionDays;
        refreshedLoan.delayDays = indicators.delayDays;
        refreshedLoan.creditRating = indicators.creditRating;
        await this.loanRepository.save(refreshedLoan);
      }
    }

    // Refresca el score crediticio de la persona en segundo plano para reflejar el estado actual
    try {
      await this.creditScoreService.calculateAndSavePersonScore(loan.idPeople);
    } catch (err) {
      // No bloquea la respuesta del abono si el recálculo analítico falla
    }

    return ok(installmentId);
  }
}

