import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangePasswordCommand } from '../change-password.command';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler
  implements ICommandHandler<ChangePasswordCommand, Result<void, AppError>>
{
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    command: ChangePasswordCommand,
  ): Promise<Result<void, AppError>> {
    const { userId, currentPassword, newPassword } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return err('USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return err('INVALID_CURRENT_PASSWORD');
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePasswordHash(userId, newHashedPassword);

    return ok(undefined);
  }
}
