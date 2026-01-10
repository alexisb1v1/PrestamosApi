import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserCommand } from '../update-user.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { PersonRepository } from '../../../../domain/repositories/person.repository';

export class UpdateUserResult {
    constructor(
        public readonly success: boolean,
        public readonly message: string,
    ) { }
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, UpdateUserResult> {
    constructor(
        @Inject(UserRepository)
        private readonly userRepository: UserRepository,
        @Inject(PersonRepository)
        private readonly personRepository: PersonRepository,
    ) { }

    async execute(command: UpdateUserCommand): Promise<UpdateUserResult> {
        try {
            // 1. Fetch User
            const user = await this.userRepository.findById(command.id);
            if (!user) {
                return new UpdateUserResult(false, 'User not found');
            }

            // 2. Fetch Linked Person
            const person = await this.personRepository.findById(user.idPeople.toString());
            if (!person) {
                return new UpdateUserResult(false, 'Linked person not found');
            }

            // 3. Update User Fields
            if (command.profile) user.profile = command.profile;
            if (command.status) user.status = command.status;
            // Note: Username and Password are NOT updated here as per requirements

            // 4. Update Person Fields
            if (command.documentType) person.documentType = command.documentType;
            if (command.documentNumber) person.documentNumber = command.documentNumber;
            if (command.firstName) person.firstName = command.firstName;
            if (command.lastName) person.lastName = command.lastName;
            if (command.birthday) person.birthday = command.birthday;

            // 5. Save changes
            // Note: Repositories' save method handles update if ID exists
            await this.personRepository.save(person);
            await this.userRepository.save(user);

            return new UpdateUserResult(true, 'User and Person updated successfully');
        } catch (error) {
            return new UpdateUserResult(false, `Failed to update user: ${error.message}`);
        }
    }
}
