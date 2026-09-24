export class GetConsolidatedReportQuery {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly companyId?: string,
  ) {}
}
