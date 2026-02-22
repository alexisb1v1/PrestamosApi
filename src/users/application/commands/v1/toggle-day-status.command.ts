export class ToggleDayStatusCommand {
  constructor(
    public readonly userId: string,
    public readonly isDayClosed: boolean,
  ) {}
}
