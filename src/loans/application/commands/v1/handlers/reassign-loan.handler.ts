import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReassignLoanCommand } from '../reassign-loan.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';

@CommandHandler(ReassignLoanCommand)
export class ReassignLoanHandler implements ICommandHandler<ReassignLoanCommand> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(command: ReassignLoanCommand): Promise<void> {
    const { loanId, newUserId } = command;

    const loan = await this.loanRepository.findById(loanId);

    if (!loan) {
      throw new HttpException(
        `Préstamo con ID ${loanId} no encontrado.`,
        HttpStatus.NOT_FOUND,
      );
    }

    loan.userId = newUserId;

    await this.loanRepository.save(loan);
  }
}
