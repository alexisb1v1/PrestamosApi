import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanInfoCommand } from '../update-loan-info.command';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(UpdateLoanInfoCommand)
export class UpdateLoanInfoHandler implements ICommandHandler<UpdateLoanInfoCommand, Result<void, AppError>> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(command: UpdateLoanInfoCommand): Promise<Result<void, AppError>> {
    const { id, phone, address } = command;

    const loan = await this.loanRepository.findById(id);
    if (!loan) {
      return err('NOT_FOUND');
    }

    loan.phone = phone;
    loan.address = address;
    await this.loanRepository.save(loan);
    return ok(undefined);
  }
}
