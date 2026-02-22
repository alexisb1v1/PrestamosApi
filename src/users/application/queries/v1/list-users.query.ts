export class ListUsersQuery {
  constructor(
    public readonly username?: string,
    public readonly idCompany?: number,
  ) {}
}
