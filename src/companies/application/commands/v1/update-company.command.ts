export class UpdateCompanyCommand {
  constructor(
    public readonly id: string,
    public readonly companyName: string,
  ) {}
}
