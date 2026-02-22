import { Loan } from '../entities/loan.entity';

export interface DashboardStats {
  totalLentToday: number;
  collectedToday: number;
  totalExpensesToday: number;
  thermometer: number;
  detailCollectedToday: {
    yape: number;
    efectivo: number;
  };
  activeClients: number;
  pendingLoans: Loan[];
}

export interface LoanRepository {
  save(loan: Loan): Promise<void>;
  findAll(): Promise<Loan[]>;
  findById(id: string): Promise<Loan | null>;
  findAllWithFilters(
    userId?: number,
    documentNumber?: string,
    companyId?: number,
  ): Promise<Loan[]>;
  findActiveByPersonId(personId: string): Promise<Loan | null>;
  findWithInstallments(id: string): Promise<Loan | null>;
  getDashboardStats(
    userId?: string,
    companyId?: string,
  ): Promise<DashboardStats>;
}

export const LoanRepository = Symbol('LoanRepository');
