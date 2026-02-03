import { Loan } from '../entities/loan.entity';

export interface LoanRepository {
    save(loan: Loan): Promise<void>;
    findAll(): Promise<Loan[]>;
    findById(id: string): Promise<Loan | null>;
    findAllWithFilters(userId?: number, documentNumber?: string, companyId?: number): Promise<Loan[]>;
    findActiveByPersonId(personId: string): Promise<Loan | null>;
    findWithInstallments(id: string): Promise<Loan | null>;
    getDashboardStats(userId?: string, companyId?: string): Promise<any>;
}

export const LoanRepository = Symbol('LoanRepository');
