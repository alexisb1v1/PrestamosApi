import { Expense } from '../../../../domain/entities/expense.entity';
import { ExpenseAppDto } from '../dto/expense-app.dto';

export class ExpenseMapper {
  static toAppDto(expense: Expense): ExpenseAppDto {
    return {
      id: expense.id!,
      description: expense.description,
      amount: expense.amount,
      userId: expense.userId,
      expenseDate: expense.expenseDate,
      status: expense.status,
    };
  }
}
