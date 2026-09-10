import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListExpensesQuery } from '../list-expenses.query';
import { Inject } from '@nestjs/common';
import { ExpenseRepository } from '@expenses/domain/repositories/expense.repository';
import { ExpenseAppDto } from '../dto/expense-app.dto';
import { ExpenseMapper } from '../mappers/expense.mapper';
import { Result, ok } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@QueryHandler(ListExpensesQuery)
export class ListExpensesHandler implements IQueryHandler<
  ListExpensesQuery,
  Result<ExpenseAppDto[], AppError>
> {
  constructor(
    @Inject(ExpenseRepository)
    private readonly repository: ExpenseRepository,
  ) {}

  /**
   * Lista los gastos registrados filtrando por usuario y fecha.
   *
   * @param query - Parámetros de filtrado:
   *   - `userId`: ID del usuario que registró los gastos.
   *   - `date`: Fecha específica para listar los gastos (opcional).
   *
   * @returns `Result.ok(ExpenseAppDto[])` con la lista de gastos mapeados.
   */
  async execute(
    query: ListExpensesQuery,
  ): Promise<Result<ExpenseAppDto[], AppError>> {
    const { userId, date } = query;
    const expenses = await this.repository.findAll(userId, date);
    return ok(expenses.map((e) => ExpenseMapper.toAppDto(e)));
  }
}
