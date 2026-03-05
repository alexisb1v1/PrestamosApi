import { LoanInstallment } from '../entities/loan-installment.entity';

export interface LoanInstallmentRepository {
  save(installment: LoanInstallment): Promise<string>;
  findByLoanId(loanId: string): Promise<LoanInstallment[]>;
  findById(id: string): Promise<LoanInstallment | null>;
  delete(id: string): Promise<void>;
  findAllInDateRange(
    startDate: Date,
    endDate: Date,
    companyId?: string,
    userId?: string,
  ): Promise<LoanInstallment[]>;
}

export const LoanInstallmentRepository = Symbol('LoanInstallmentRepository');
