import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListExpensesQuery } from '../list-expenses.query';
import { Inject } from '@nestjs/common';
import { ExpenseRepository } from '../../../../domain/repositories/expense.repository';
import { Expense } from '../../../../domain/entities/expense.entity';

@QueryHandler(ListExpensesQuery)
export class ListExpensesHandler implements IQueryHandler<
  ListExpensesQuery,
  Expense[]
> {
  constructor(
    @Inject(ExpenseRepository)
    private readonly repository: ExpenseRepository,
  ) {}

  async execute(query: ListExpensesQuery): Promise<Expense[]> {
    const { userId, date } = query;
    return await this.repository.findAll(userId, date);
  }
}
