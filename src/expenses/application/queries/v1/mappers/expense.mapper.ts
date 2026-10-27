import { Expense } from '@expenses/domain/entities/expense.entity';
import { ExpenseAppDto } from '../dto/expense-app.dto';

export class ExpenseMapper {
  static toAppDto(expense: Expense): ExpenseAppDto {
    return {
      id: expense.id!,
      description: expense.description,
      amount: expense.amount,
      userId: expense.userId,
      companyId: expense.companyId,
      expenseDate: expense.expenseDate,
      status: expense.status,
      userName: expense.userName,
      userFullName: expense.userFullName,
    };
  }
}
