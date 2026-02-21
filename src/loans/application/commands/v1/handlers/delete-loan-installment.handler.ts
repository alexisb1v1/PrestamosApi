import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanInstallmentCommand } from '../delete-loan-installment.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { LoanInstallmentRepository } from '../../../../domain/repositories/loan-installment.repository';

import { LoanRepository } from '../../../../domain/repositories/loan.repository';

@CommandHandler(DeleteLoanInstallmentCommand)
export class DeleteLoanInstallmentHandler implements ICommandHandler<DeleteLoanInstallmentCommand> {
    constructor(
        @Inject(LoanInstallmentRepository)
        private readonly repository: LoanInstallmentRepository,
        @Inject(LoanRepository)
        private readonly loanRepository: LoanRepository,
    ) { }

    async execute(command: DeleteLoanInstallmentCommand): Promise<void> {
        const { installmentId } = command;

        const installment = await this.repository.findById(installmentId);
        if (!installment) {
            throw new HttpException('Abono no encontrado', HttpStatus.NOT_FOUND);
        }

        const loanId = installment.loanId;
        await this.repository.delete(installmentId);

        // After deleting, check if the loan should return to 'Activo' status
        const refreshedLoan = await this.loanRepository.findWithInstallments(loanId);
        if (refreshedLoan && refreshedLoan.status === 'Liquidado') {
            const totalPaid = refreshedLoan.installments?.reduce((sum, inst) => sum + inst.amount, 0) || 0;
            const totalToPay = refreshedLoan.amount + refreshedLoan.interest;

            if (totalPaid < totalToPay) {
                refreshedLoan.status = 'Activo';
                await this.loanRepository.save(refreshedLoan);
            }
        }
    }
}
