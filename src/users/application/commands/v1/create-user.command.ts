export class CreateUserCommand {
  constructor(
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly profile: string,
    // Person data
    public readonly documentType: string,
    public readonly documentNumber: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly birthday: Date,
    public readonly idCompany?: string,
  ) {}
}
