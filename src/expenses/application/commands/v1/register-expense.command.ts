export class RegisterExpenseCommand {
  constructor(
    public readonly description: string,
    public readonly amount: number,
    public readonly userId: string,
  ) {}
}
