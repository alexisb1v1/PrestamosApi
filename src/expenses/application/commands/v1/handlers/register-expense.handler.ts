import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterExpenseCommand } from '../register-expense.command';
import { Inject } from '@nestjs/common';
import { ExpenseRepository } from '@expenses/domain/repositories/expense.repository';
import { Expense } from '@expenses/domain/entities/expense.entity';
import { Result, ok } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(RegisterExpenseCommand)
export class RegisterExpenseHandler implements ICommandHandler<
  RegisterExpenseCommand,
  Result<string, AppError>
> {
  constructor(
    @Inject(ExpenseRepository)
    private readonly repository: ExpenseRepository,
  ) {}

  /**
   * Registra un nuevo gasto en el sistema asociado a un usuario.
   *
   * @param command - Datos del gasto:
   *   - `description`: Concepto o descripción del gasto.
   *   - `amount`: Monto gastado.
   *   - `userId`: ID del usuario que registra el gasto.
   *
   * @returns `Result.ok(string)` con el ID del gasto registrado.
   */
  async execute(
    command: RegisterExpenseCommand,
  ): Promise<Result<string, AppError>> {
    const { description, amount, userId } = command;

    const expense = new Expense(
      description,
      amount,
      userId,
      new Date(),
      'REGISTERED',
    );

    const id = await this.repository.save(expense);
    return ok(id);
  }
}
