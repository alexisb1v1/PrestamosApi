export class DeleteLoanInstallmentCommand {
  constructor(
    public readonly installmentId: string,
    public readonly userId: string,
  ) {}
}
