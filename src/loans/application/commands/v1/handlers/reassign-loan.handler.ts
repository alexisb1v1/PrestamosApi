import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReassignLoanCommand } from '../reassign-loan.command';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(ReassignLoanCommand)
export class ReassignLoanHandler implements ICommandHandler<ReassignLoanCommand, Result<void, AppError>> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(command: ReassignLoanCommand): Promise<Result<void, AppError>> {
    const { loanId, newUserId } = command;

    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      return err('NOT_FOUND');
    }

    loan.userId = newUserId;
    await this.loanRepository.save(loan);
    return ok(undefined);
  }
}
