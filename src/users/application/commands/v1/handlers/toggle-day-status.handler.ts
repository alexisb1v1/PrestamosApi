import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ToggleDayStatusCommand } from '../toggle-day-status.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';

@CommandHandler(ToggleDayStatusCommand)
export class ToggleDayStatusHandler implements ICommandHandler<ToggleDayStatusCommand> {
    constructor(
        @Inject(UserRepository)
        private readonly repository: UserRepository,
    ) { }

    async execute(command: ToggleDayStatusCommand): Promise<void> {
        const { userId, isDayClosed } = command;
        const user = await this.repository.findById(userId);

        if (!user) {
            throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
        }

        user.isDayClosed = isDayClosed;
        await this.repository.save(user);
    }
}
