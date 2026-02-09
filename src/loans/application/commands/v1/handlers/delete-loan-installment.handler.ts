import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanInstallmentCommand } from '../delete-loan-installment.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { LoanInstallmentRepository } from '../../../../domain/repositories/loan-installment.repository';

@CommandHandler(DeleteLoanInstallmentCommand)
export class DeleteLoanInstallmentHandler implements ICommandHandler<DeleteLoanInstallmentCommand> {
    constructor(
        @Inject(LoanInstallmentRepository)
        private readonly repository: LoanInstallmentRepository,
    ) { }

    async execute(command: DeleteLoanInstallmentCommand): Promise<void> {
        const { installmentId } = command;

        // Optionally, we could fetch custom logic here (e.g. check if user has permission)
        // For now, we proceed directly to delete.
        // It's good practice to check if it exists first if we want to return 404, 
        // but physical delete is idempotent usually (if not found, nothing happens).
        // However, let's just call delete.

        await this.repository.delete(installmentId);
    }
}
