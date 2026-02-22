export class CreatePersonCommand {
  constructor(
    public readonly documentType: string,
    public readonly documentNumber: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly birthday?: Date,
  ) {}
}
