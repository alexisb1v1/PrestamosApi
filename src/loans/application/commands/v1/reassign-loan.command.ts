export class ReassignLoanCommand {
  constructor(
    public readonly loanId: string,
    public readonly newUserId: number,
  ) {}
}
