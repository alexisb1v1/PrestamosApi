import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { Person } from '@users/domain/entities/person.entity';
import { FindPersonQuery } from '../find-person.query';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@QueryHandler(FindPersonQuery)
export class FindPersonHandler implements IQueryHandler<
  FindPersonQuery,
  Result<Person, AppError>
> {
  constructor(
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  /**
   * Busca una persona por tipo y número de documento.
   *
   * @param query - Parámetros de búsqueda:
   *   - `documentType`: Tipo de documento.
   *   - `documentNumber`: Número de documento.
   *
   * @returns `Result.ok(Person)` con la entidad de la persona encontrada.
   * @returns `Result.err('NOT_FOUND')` si la persona no existe.
   */
  async execute(query: FindPersonQuery): Promise<Result<Person, AppError>> {
    const person = await this.personRepository.findByDocument(
      query.documentType,
      query.documentNumber,
    );
    if (!person) {
      return err('NOT_FOUND');
    }
    return ok(person);
  }
}
