export class GetCollectorReportQuery {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly companyId?: string,
    public readonly userId?: string,
  ) {}
}
