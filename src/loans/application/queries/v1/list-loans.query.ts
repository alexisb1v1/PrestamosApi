export class ListLoansQuery {
  constructor(
    public readonly userId?: number,
    public readonly documentNumber?: string,
    public readonly companyId?: number,
  ) {}
}
