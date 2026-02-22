import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteExpenseCommand } from '../delete-expense.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ExpenseRepository } from '../../../../domain/repositories/expense.repository';
import { Expense } from '../../../../domain/entities/expense.entity';

@CommandHandler(DeleteExpenseCommand)
export class DeleteExpenseHandler implements ICommandHandler<DeleteExpenseCommand> {
  constructor(
    @Inject(ExpenseRepository)
    private readonly repository: ExpenseRepository,
  ) {}

  async execute(command: DeleteExpenseCommand): Promise<void> {
    const { expenseId } = command;
    const expense = await this.repository.findById(expenseId);

    if (!expense) {
      throw new HttpException('Gasto no encontrado', HttpStatus.NOT_FOUND);
    }

    // Logical delete
    const expenseToDelete = new Expense(
      expense.description,
      expense.amount,
      expense.userId,
      expense.expenseDate,
      'ELIMINADO',
      expense.id,
    );

    await this.repository.save(expenseToDelete);
  }
}
