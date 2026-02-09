import { LoanInstallment } from '../entities/loan-installment.entity';

export interface LoanInstallmentRepository {
    save(installment: LoanInstallment): Promise<string>;
    findByLoanId(loanId: string): Promise<LoanInstallment[]>;
    delete(id: string): Promise<void>;
}

export const LoanInstallmentRepository = Symbol('LoanInstallmentRepository');
