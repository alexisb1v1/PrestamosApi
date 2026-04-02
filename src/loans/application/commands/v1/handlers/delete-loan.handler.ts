import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanCommand } from '../delete-loan.command';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(DeleteLoanCommand)
export class DeleteLoanHandler implements ICommandHandler<DeleteLoanCommand, Result<void, AppError>> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

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
