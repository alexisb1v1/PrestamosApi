import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisterExpenseHandler } from '@expenses/application/commands/v1/handlers/register-expense.handler';
import { DeleteExpenseHandler } from '@expenses/application/commands/v1/handlers/delete-expense.handler';
import { ListExpensesHandler } from '@expenses/application/queries/v1/handlers/list-expenses.handler';
import { PostgresExpenseRepository } from '../repositories/postgres-expense.repository';
import { ExpenseEntity } from '../repositories/entities/expense.entity';
import { ExpenseRepository } from '@expenses/domain/repositories/expense.repository';
import { RegisterExpenseAction } from '@expenses/interfaces/http/v1/expense/actions/register-expense.action';
import { ListExpensesAction } from '@expenses/interfaces/http/v1/expense/actions/list-expenses.action';
import { DeleteExpenseAction } from '@expenses/interfaces/http/v1/expense/actions/delete-expense.action';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([ExpenseEntity])],
  controllers: [RegisterExpenseAction, ListExpensesAction, DeleteExpenseAction],
  providers: [
    RegisterExpenseHandler,
    DeleteExpenseHandler,
    ListExpensesHandler,
    {
      provide: ExpenseRepository,
      useClass: PostgresExpenseRepository,
    },
  ],
  exports: [ExpenseRepository],
})
export class ExpensesModule {}
