import { Expense } from '../entities/expense.entity';

export interface ExpenseRepository {
  save(expense: Expense): Promise<string>;
  findById(id: string): Promise<Expense | null>;
  findAll(userId?: string, date?: Date, companyId?: number): Promise<Expense[]>;
  findAllInDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string,
    companyId?: number,
  ): Promise<Expense[]>;
}

export const ExpenseRepository = Symbol('ExpenseRepository');
