import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../create-user.command';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { User } from '../../../../domain/entities/user.entity';
import { Person } from '../../../../domain/entities/person.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, Result<string, AppError>> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) { }

  async execute(command: CreateUserCommand): Promise<Result<string, AppError>> {
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

    const existingPerson = await this.personRepository.findByDocumentNumber(documentNumber);
    if (existingPerson) {
      personId = existingPerson.id!;
    } else {
      const newPerson = new Person(documentType, documentNumber, firstName, lastName, birthday);
      personId = await this.personRepository.save(newPerson);
    }

    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    const newUser = new User(
      username,
      hashedPassword,
      profile,
      'ACTIVE',
      Number(personId),
      undefined,
      false,
      idCompany,
    );

    const userId = await this.userRepository.save(newUser);
    return ok(userId);
  }
}
