import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanCommand } from '../create-loan.command';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { Loan } from '../../../../domain/entities/loan.entity';

@CommandHandler(CreateLoanCommand)
export class CreateLoanHandler implements ICommandHandler<CreateLoanCommand> {
    constructor(
        @Inject(LoanRepository)
        private readonly loanRepository: LoanRepository,
    ) { }

    async execute(command: CreateLoanCommand): Promise<void> {
        const { idPeople, startDate, endDate, amount, interest, fee, userId } = command;

        // Business logic...

        const status = 'PENDING';
        const newLoan = new Loan(
            idPeople,
            startDate,
            endDate,
            amount,
            interest,
            fee,
            new Date(),
            userId,
            status
        );

        await this.loanRepository.save(newLoan);
    }
}
