import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../create-user.command';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { User } from '../../../../domain/entities/user.entity';
import { Person } from '../../../../domain/entities/person.entity';

export class CreateUserResult {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly userId?: string,
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<
  CreateUserCommand,
  CreateUserResult
> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    try {
      const {
        username,
        passwordHash,
        profile,
        documentType,
        documentNumber,
        firstName,
        lastName,
        birthday,
        idCompany,
      } = command;

      let personId: string;

      // 1. Check if Person already exists by document number
      const existingPerson =
        await this.personRepository.findByDocumentNumber(documentNumber);

      if (existingPerson) {
        personId = existingPerson.id!;
      } else {
        const newPerson = new Person(
          documentType,
          documentNumber,
          firstName,
          lastName,
          birthday,
        );
        personId = await this.personRepository.save(newPerson);
      }

      // 2. Hash the plain-text password server-side before saving
      const hashedPassword = await bcrypt.hash(passwordHash, 10);

      // 3. Create User with the hashed password
      const status = 'ACTIVE';
      const newUser = new User(
        username,
        hashedPassword,
        profile,
        status,
        Number(personId),
        undefined,
        false,
        idCompany,
      );

      const userId = await this.userRepository.save(newUser);

      return new CreateUserResult(
        true,
        'User and Person created successfully',
        userId,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new CreateUserResult(
        false,
        `Failed to create user: ${errorMessage}`,
      );
    }
  }
}
