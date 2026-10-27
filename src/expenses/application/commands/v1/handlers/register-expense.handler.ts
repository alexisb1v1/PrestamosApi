import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterExpenseCommand } from '../register-expense.command';
import { Inject } from '@nestjs/common';
import { ExpenseRepository } from '@expenses/domain/repositories/expense.repository';
import { Expense } from '@expenses/domain/entities/expense.entity';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(RegisterExpenseCommand)
export class RegisterExpenseHandler implements ICommandHandler<
  RegisterExpenseCommand,
  Result<string, AppError>
> {
  constructor(
    @Inject(ExpenseRepository)
    private readonly repository: ExpenseRepository,
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Registra un nuevo gasto en el sistema asociado a un usuario y su empresa.
   *
   * @param command - Datos del gasto:
   *   - `description`: Concepto o descripción del gasto.
   *   - `amount`: Monto gastado.
   *   - `userId`: ID del usuario que registra el gasto.
   *   - `companyId`: ID de la empresa (opcional en comando, resuelto si no viene).
   *
   * @returns `Result.ok(string)` con el ID del gasto registrado.
   */
  async execute(
    command: RegisterExpenseCommand,
  ): Promise<Result<string, AppError>> {
    const { description, amount, userId } = command;

    let companyId = command.companyId;
    if (!companyId) {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.idCompany) {
        return err('EXPENSE_COMPANY_REQUIRED');
      }
      companyId = user.idCompany;
    }

    const expense = new Expense(
      description,
      amount,
      userId,
      new Date(),
      'REGISTERED',
      companyId,
    );

    const id = await this.repository.save(expense);
    return ok(id);
  }
}
