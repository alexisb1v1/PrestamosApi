export class GetCapitalInvestmentReportQuery {
  constructor(
    public readonly months: number = 12,
    public readonly companyId?: string,
  ) {}
}
