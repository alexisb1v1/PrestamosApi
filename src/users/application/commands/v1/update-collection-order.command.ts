export class UpdateCollectionOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionOrder: string[],
  ) {}
}
