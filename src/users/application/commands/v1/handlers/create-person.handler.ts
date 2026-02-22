import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePersonCommand } from '../create-person.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { Person } from '../../../../domain/entities/person.entity';

@CommandHandler(CreatePersonCommand)
export class CreatePersonHandler implements ICommandHandler<CreatePersonCommand> {
  constructor(
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(command: CreatePersonCommand): Promise<string> {
    const { documentType, documentNumber, firstName, lastName, birthday } =
      command;

    // Check if person already exists
    const existingPerson = await this.personRepository.findByDocument(
      documentType,
      documentNumber,
    );
    if (existingPerson) {
      throw new HttpException(
        'Ya existe una persona registrada con este documento',
        HttpStatus.BAD_REQUEST,
      );
    }

    const person = new Person(
      documentType,
      documentNumber,
      firstName,
      lastName,
      birthday,
    );

    return this.personRepository.save(person);
  }
}
