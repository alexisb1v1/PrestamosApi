import { Loan } from '../entities/loan.entity';

export interface LoanRepository {
    save(loan: Loan): Promise<void>;
    findAll(): Promise<Loan[]>;
    findById(id: string): Promise<Loan | null>;
    findAllWithFilters(userId?: number, documentNumber?: string): Promise<Loan[]>;
}

export const LoanRepository = Symbol('LoanRepository');
