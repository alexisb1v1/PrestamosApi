import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterLoanInstallmentCommand } from '../register-loan-installment.command';
import { Inject } from '@nestjs/common';
import { LoanInstallmentRepository } from '../../../../domain/repositories/loan-installment.repository';
import { LoanInstallment } from '../../../../domain/entities/loan-installment.entity';

@CommandHandler(RegisterLoanInstallmentCommand)
export class RegisterLoanInstallmentHandler implements ICommandHandler<RegisterLoanInstallmentCommand> {
    constructor(
        @Inject(LoanInstallmentRepository)
        private readonly repository: LoanInstallmentRepository,
    ) { }

    async execute(command: RegisterLoanInstallmentCommand): Promise<string> {
        const { loanId, amount, userId } = command;

        const installment = new LoanInstallment(
            loanId,
            new Date(),
            amount,
            userId,
        );

        return await this.repository.save(installment);
    }
}
