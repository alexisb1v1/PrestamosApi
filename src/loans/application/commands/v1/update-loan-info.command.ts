export class UpdateLoanInfoCommand {
  constructor(
    public readonly id: string,
    public readonly phone: string,
    public readonly address: string,
  ) { }
}
