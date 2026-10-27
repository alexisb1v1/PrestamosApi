export class Expense {
  constructor(
    public readonly description: string,
    public readonly amount: number,
    public readonly userId: string,
    public readonly expenseDate: Date,
    public readonly status: string,
    public readonly companyId: string,
    public readonly id?: string,
    public readonly userName?: string,
    public readonly userFullName?: string,
  ) {}
}

