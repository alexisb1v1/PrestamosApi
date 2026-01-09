import { Loan } from '../entities/loan.entity';

export interface LoanRepository {
    save(loan: Loan): Promise<void>;
    findAll(): Promise<Loan[]>;
    findById(id: string): Promise<Loan | null>;
}

export const LoanRepository = Symbol('LoanRepository');
