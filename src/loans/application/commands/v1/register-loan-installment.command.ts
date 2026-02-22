export class RegisterLoanInstallmentCommand {
  constructor(
    public readonly loanId: string,
    public readonly amount: number,
    public readonly userId: string,
    public readonly paymentType: string,
  ) {}
}
