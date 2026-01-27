import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from '../../interfaces/http/v1/expenses.controller';
import { RegisterExpenseHandler } from '../../application/commands/v1/handlers/register-expense.handler';
import { DeleteExpenseHandler } from '../../application/commands/v1/handlers/delete-expense.handler';
import { ListExpensesHandler } from '../../application/queries/v1/handlers/list-expenses.handler';
import { PostgresExpenseRepository } from '../repositories/postgres-expense.repository';
import { ExpenseEntity } from '../repositories/entities/expense.entity';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([ExpenseEntity]),
    ],
    controllers: [ExpensesController],
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
export class ExpensesModule { }
