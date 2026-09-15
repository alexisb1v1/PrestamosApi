export class LoginQuery {
  constructor(
    public readonly username: string,
    public readonly password: string,
    public readonly fingerprint: string,
    public readonly tenant?: string,
  ) {}
}
