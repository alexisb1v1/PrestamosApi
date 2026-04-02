export class ListLoansQuery {
  constructor(
    public readonly isLiquidated: boolean,
    public readonly userId?: number,
    public readonly searchQuery?: string,
    public readonly companyId?: number,
  ) { }
}
