import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ToggleDayStatusCommand } from '../toggle-day-status.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(ToggleDayStatusCommand)
export class ToggleDayStatusHandler implements ICommandHandler<ToggleDayStatusCommand, Result<void, AppError>> {
  constructor(
    @Inject(UserRepository)
    private readonly repository: UserRepository,
  ) {}

  async execute(command: ToggleDayStatusCommand): Promise<Result<void, AppError>> {
    const { userId, isDayClosed } = command;
    const user = await this.repository.findById(userId);

    if (!user) {
      return err('NOT_FOUND');
    }

    user.isDayClosed = isDayClosed;
    await this.repository.save(user);
    return ok(undefined);
  }
}
