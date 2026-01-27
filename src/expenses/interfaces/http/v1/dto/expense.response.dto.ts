import { ApiProperty } from '@nestjs/swagger';
import { Expense } from '../../../../domain/entities/expense.entity';

export class ExpenseResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    expenseDate: Date;

    @ApiProperty()
    status: string;

    constructor(expense: Expense) {
        this.id = expense.id!;
        this.description = expense.description;
        this.amount = expense.amount;
        this.userId = expense.userId;
        this.expenseDate = expense.expenseDate;
        this.status = expense.status;
    }
}
