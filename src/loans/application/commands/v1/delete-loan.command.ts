export class DeleteLoanCommand {
  constructor(
    public readonly loanId: string,
    public readonly companyId?: string,
  ) {}
}
