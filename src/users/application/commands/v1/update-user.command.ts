export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    // User fields
    public readonly profile?: string,
    public readonly status?: string,
    // Person fields
    public readonly documentType?: string,
    public readonly documentNumber?: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly birthday?: Date,
  ) {}
}
