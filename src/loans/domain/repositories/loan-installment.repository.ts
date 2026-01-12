import { LoanInstallment } from '../entities/loan-installment.entity';

export interface LoanInstallmentRepository {
    save(installment: LoanInstallment): Promise<string>;
    findByLoanId(loanId: string): Promise<LoanInstallment[]>;
}

export const LoanInstallmentRepository = Symbol('LoanInstallmentRepository');
