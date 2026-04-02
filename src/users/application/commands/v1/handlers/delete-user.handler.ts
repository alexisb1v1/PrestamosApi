import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../delete-user.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, Result<void, AppError>> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: DeleteUserCommand): Promise<Result<void, AppError>> {
    const user = await this.userRepository.findById(command.id);
    if (!user) {
      return err('NOT_FOUND');
    }

    user.status = 'INACTIVE';
    await this.userRepository.save(user);
    return ok(undefined);
  }
}
