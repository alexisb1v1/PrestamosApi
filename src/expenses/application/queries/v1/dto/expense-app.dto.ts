export class ExpenseAppDto {
  id: string;
  description: string;
  amount: number;
  userId: string;
  companyId: string;
  expenseDate: Date;
  status: string;
  userName?: string;
  userFullName?: string;
}

