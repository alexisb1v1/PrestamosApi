export class CreateCompanyCommand {
  constructor(
    public readonly companyName: string,
    public readonly subdomain: string,
  ) {}
}
