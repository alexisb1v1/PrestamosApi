import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanCommand } from '../delete-loan.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';

@CommandHandler(DeleteLoanCommand)
export class DeleteLoanHandler implements ICommandHandler<DeleteLoanCommand> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(command: DeleteLoanCommand): Promise<void> {
    const { loanId } = command;

    const loan = await this.loanRepository.findById(loanId);

    if (!loan) {
      throw new HttpException(
        `Préstamo con ID ${loanId} no encontrado.`,
        HttpStatus.NOT_FOUND,
      );
    }

    loan.status = 'Eliminado';

    await this.loanRepository.save(loan);
  }
}
