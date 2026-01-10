import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../delete-user.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';

export class DeleteUserResult {
    constructor(
        public readonly success: boolean,
        public readonly message: string,
    ) { }
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, DeleteUserResult> {
    constructor(
        @Inject(UserRepository)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(command: DeleteUserCommand): Promise<DeleteUserResult> {
        try {
            const user = await this.userRepository.findById(command.id);
            if (!user) {
                return new DeleteUserResult(false, 'User not found');
            }

            user.status = 'INACTIVE';
            await this.userRepository.save(user);

            return new DeleteUserResult(true, 'User deactivated successfully');
        } catch (error) {
            return new DeleteUserResult(false, `Failed to delete user: ${error.message}`);
        }
    }
}
