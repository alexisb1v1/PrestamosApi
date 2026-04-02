import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { Person } from '../../../../domain/entities/person.entity';
import { FindPersonQuery } from '../find-person.query';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@QueryHandler(FindPersonQuery)
export class FindPersonHandler implements IQueryHandler<FindPersonQuery, Result<Person, AppError>> {
  constructor(
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

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
