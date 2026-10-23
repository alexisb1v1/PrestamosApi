export class UpdateCompanyCommand {
  constructor(
    public readonly id: string,
    public readonly companyName: string,
    public readonly subdomain?: string,
    public readonly settings?: Record<string, any>,
  ) {}
}
