export class GetLoanDetailsQuery {
  constructor(
    public readonly loanId: string,
    public readonly companyId?: string,
  ) {}
}
