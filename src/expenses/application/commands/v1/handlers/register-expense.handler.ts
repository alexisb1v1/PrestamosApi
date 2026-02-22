import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterExpenseCommand } from '../register-expense.command';
import { Inject } from '@nestjs/common';
import { ExpenseRepository } from '../../../../domain/repositories/expense.repository';
import { Expense } from '../../../../domain/entities/expense.entity';

@CommandHandler(RegisterExpenseCommand)
export class RegisterExpenseHandler implements ICommandHandler<RegisterExpenseCommand> {
  constructor(
    @Inject(ExpenseRepository)
    private readonly repository: ExpenseRepository,
  ) {}

  async execute(command: RegisterExpenseCommand): Promise<string> {
    const { description, amount, userId } = command;

    const expense = new Expense(
      description,
      amount,
      userId,
      new Date(),
      'REGISTERED', // Default status
    );

    return await this.repository.save(expense);
  }
}
