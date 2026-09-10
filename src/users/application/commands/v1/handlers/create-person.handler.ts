import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePersonCommand } from '../create-person.command';
import { Inject } from '@nestjs/common';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { Person } from '@users/domain/entities/person.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(CreatePersonCommand)
export class CreatePersonHandler implements ICommandHandler<CreatePersonCommand> {
  constructor(
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  /**
   * Registra una nueva persona en el sistema, previa validación de existencia
   * por tipo y número de documento.
   *
   * @param command - Datos de la persona:
   *   - `documentType`: Tipo de documento (DNI, RUC, etc).
   *   - `documentNumber`: Número de documento.
   *   - `firstName`: Nombres.
   *   - `lastName`: Apellidos.
   *   - `birthday`: Fecha de nacimiento.
   *
   * @returns `Result.ok(string)` con el ID de la persona creada.
   * @returns `Result.err('ALREADY_EXISTS')` si la persona ya está registrada.
   */
  async execute(
    command: CreatePersonCommand,
  ): Promise<Result<string, AppError>> {
    const { documentType, documentNumber, firstName, lastName, birthday } =
      command;

    const existingPerson = await this.personRepository.findByDocument(
      documentType,
      documentNumber,
    );
    if (existingPerson) {
      return err('PERSON_ALREADY_EXISTS');
    }

    const person = new Person(
      documentType,
      documentNumber,
      firstName,
      lastName,
      birthday,
    );
    const id = await this.personRepository.save(person);
    return ok(id);
  }
}
