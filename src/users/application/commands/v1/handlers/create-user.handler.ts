import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../create-user.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { User } from '../../../../domain/entities/user.entity';
import { Person } from '../../../../domain/entities/person.entity';

export class CreateUserResult {
    constructor(
        public readonly success: boolean,
        public readonly message: string,
        public readonly userId?: string,
    ) { }
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, CreateUserResult> {
    constructor(
        @Inject(UserRepository)
        private readonly userRepository: UserRepository,
        @Inject(PersonRepository)
        private readonly personRepository: PersonRepository,
    ) { }

    async execute(command: CreateUserCommand): Promise<CreateUserResult> {
        try {
            const { username, passwordHash, profile, documentType, documentNumber, firstName, lastName, birthday } = command;

            let personId: string;

            // 1. Check if Person already exists by document number
            const existingPerson = await this.personRepository.findByDocumentNumber(documentNumber);

            if (existingPerson) {
                // Person already exists, use their ID
                personId = existingPerson.id!;
            } else {
                // Create new Person
                const newPerson = new Person(
                    documentType,
                    documentNumber,
                    firstName,
                    lastName,
                    birthday,
                );

                personId = await this.personRepository.save(newPerson);
            }

            // 2. Create User with the Person ID
            const status = 'ACTIVE';
            const newUser = new User(
                username,
                passwordHash,
                profile,
                status,
                Number(personId),
            );

            const userId = await this.userRepository.save(newUser);

            return new CreateUserResult(true, 'User and Person created successfully', userId);
        } catch (error) {
            return new CreateUserResult(false, `Failed to create user: ${error.message}`);
        }
    }
}
