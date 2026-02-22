export class CreateLoanCommand {
  constructor(
    public readonly idPeople: number,
    public readonly amount: number,
    public readonly userId: number,
    public readonly address: string,
  ) {}
}
