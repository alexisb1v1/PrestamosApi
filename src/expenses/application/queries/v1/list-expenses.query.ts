export class ListExpensesQuery {
  constructor(
    public readonly userId?: string,
    public readonly date?: Date,
  ) {}
}
