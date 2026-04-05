import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserCommand } from '../update-user.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, Result<void, AppError>> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<Result<void, AppError>> {
    const user = await this.userRepository.findById(command.id);
    if (!user) {
      return err('NOT_FOUND');
    }

    const person = await this.personRepository.findById(user.idPeople.toString());
    if (!person) {
      return err('NOT_FOUND');
    }

    if (command.profile) user.profile = command.profile;
    if (command.status) user.status = command.status;

    if (command.documentType) person.documentType = command.documentType;
    if (command.documentNumber) person.documentNumber = command.documentNumber;
    if (command.firstName) person.firstName = command.firstName;
    if (command.lastName) person.lastName = command.lastName;
    if (command.birthday !== undefined) person.birthday = command.birthday;

    await this.personRepository.save(person);
    await this.userRepository.save(user);
    return ok(undefined);
  }
}
