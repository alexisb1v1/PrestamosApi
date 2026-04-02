import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePersonCommand } from '../create-person.command';
import { Inject } from '@nestjs/common';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { Person } from '../../../../domain/entities/person.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(CreatePersonCommand)
export class CreatePersonHandler implements ICommandHandler<CreatePersonCommand> {
  constructor(
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(command: CreatePersonCommand): Promise<Result<string, AppError>> {
    const { documentType, documentNumber, firstName, lastName, birthday } = command;

    const existingPerson = await this.personRepository.findByDocument(
      documentType,
      documentNumber,
    );
    if (existingPerson) {
      return err('ALREADY_EXISTS');
    }

    const person = new Person(documentType, documentNumber, firstName, lastName, birthday);
    const id = await this.personRepository.save(person);
    return ok(id);
  }
}
