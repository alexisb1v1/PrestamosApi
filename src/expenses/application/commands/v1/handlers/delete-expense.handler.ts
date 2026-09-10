import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteExpenseCommand } from '../delete-expense.command';
import { Inject } from '@nestjs/common';
import { ExpenseRepository } from '@expenses/domain/repositories/expense.repository';
import { Expense } from '@expenses/domain/entities/expense.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(DeleteExpenseCommand)
export class DeleteExpenseHandler implements ICommandHandler<
  DeleteExpenseCommand,
  Result<void, AppError>
> {
  constructor(
    @Inject(ExpenseRepository)
    private readonly repository: ExpenseRepository,
  ) {}

  /**
   * Cambia el estado de un gasto a 'ELIMINADO' para anularlo en el sistema.
   *
   * @param command - Datos de la solicitud:
   *   - `expenseId`: ID del gasto a eliminar.
   *
   * @returns `Result.ok(void)` si el gasto fue marcado correctamente.
   * @returns `Result.err('NOT_FOUND')` si el gasto no existe.
   */
  async execute(
    command: DeleteExpenseCommand,
  ): Promise<Result<void, AppError>> {
    const { expenseId } = command;
    const expense = await this.repository.findById(expenseId);

    if (!expense) {
      return err('NOT_FOUND');
    }

    const expenseToDelete = new Expense(
      expense.description,
      expense.amount,
      expense.userId,
      expense.expenseDate,
      'ELIMINADO',
      expense.id,
    );

    await this.repository.save(expenseToDelete);
    return ok(undefined);
  }
}
