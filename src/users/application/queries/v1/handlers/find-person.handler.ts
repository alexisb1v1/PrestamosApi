import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { Person } from '@users/domain/entities/person.entity';
import { FindPersonQuery } from '../find-person.query';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { DniLookupService } from '@users/application/services/dni-lookup.service';

@QueryHandler(FindPersonQuery)
export class FindPersonHandler implements IQueryHandler<
  FindPersonQuery,
  Result<Person, AppError>
> {
  constructor(
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
    private readonly dniLookupService: DniLookupService,
  ) {}

  /**
   * Busca una persona por tipo y número de documento.
   * Aplica fallback a Reniec/APIs si es DNI y no existe localmente.
   */
  async execute(query: FindPersonQuery): Promise<Result<Person, AppError>> {
    const person = await this.personRepository.findByDocument(
      query.documentType,
      query.documentNumber,
    );

    if (person) {
      return ok(person);
    }

    // Si no existe y es DNI (longitud 8), usamos el fallback en APIs
    if (
      (query.documentType === 'DNI' || query.documentType === '1') &&
      query.documentNumber.length === 8
    ) {
      const apiPerson = await this.dniLookupService.findDni(query.documentType, query.documentNumber);
      if (apiPerson) {
        return ok(apiPerson);
      }
    }

    return err('NOT_FOUND');
  }
}
