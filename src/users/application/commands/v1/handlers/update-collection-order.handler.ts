import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCollectionOrderCommand } from '../update-collection-order.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(UpdateCollectionOrderCommand)
export class UpdateCollectionOrderHandler implements ICommandHandler<UpdateCollectionOrderCommand, Result<void, AppError>> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: UpdateCollectionOrderCommand): Promise<Result<void, AppError>> {
    const { userId, collectionOrder } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return err('NOT_FOUND');
    }

    await this.userRepository.updateCollectionOrder(userId, collectionOrder);
    return ok(undefined);
  }
}
