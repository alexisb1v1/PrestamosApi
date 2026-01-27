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
    ) { }

    async execute(command: DeleteExpenseCommand): Promise<void> {
        const { expenseId } = command;
        const expense = await this.repository.findById(expenseId);

        if (!expense) {
            throw new HttpException('Gasto no encontrado', HttpStatus.NOT_FOUND);
        }

        // Logical delete
        const updatedExpense = { ...expense, status: 'ELIMINADO' }; // Create a new object to avoid mutation if immutable
        // But since our domain object is mutable (check Entity definition), or we need a way to update it.
        // Let's check Expense entity again. 
        // It has readonly properties in constructor but it is a class. 
        // We might need to create a new instance or add a method to change status.
        // For simplicity, I will re-instantiate it with new status.

        const newExpenseVal = {
            ...expense,
            status: 'ELIMINADO'
        };

        // Re-create class instance as properties are public readonly
        // Ideally, domain entity should have methods.
        // Let's follow the pattern used in User (direct property assignment if not readonly, or new instance).
        // In Expense entity, properties are public readonly. So I must create a new instance.

        const expenseToDelete = new Expense(
            expense.description,
            expense.amount,
            expense.userId,
            expense.expenseDate,
            'ELIMINADO',
            expense.id
        );

        await this.repository.save(expenseToDelete);
    }
}
