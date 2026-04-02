import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterExpenseCommand } from '../register-expense.command';
import { Inject } from '@nestjs/common';
import { ExpenseRepository } from '../../../../domain/repositories/expense.repository';
import { Expense } from '../../../../domain/entities/expense.entity';
import { Result, ok } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(RegisterExpenseCommand)
export class RegisterExpenseHandler implements ICommandHandler<RegisterExpenseCommand, Result<string, AppError>> {
  constructor(
    @Inject(ExpenseRepository)
    private readonly repository: ExpenseRepository,
  ) {}

  async execute(command: RegisterExpenseCommand): Promise<Result<string, AppError>> {
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
