import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { Person } from '../../../../domain/entities/person.entity';
import { FindPersonQuery } from '../find-person.query'; // Assuming TS will resolve .ts in write tool, but standard is no extension in import

@QueryHandler(FindPersonQuery)
export class FindPersonHandler implements IQueryHandler<FindPersonQuery> {
    constructor(
        @Inject(PersonRepository)
        private readonly personRepository: PersonRepository,
    ) { }

    async execute(query: FindPersonQuery): Promise<Person | null> {
        return this.personRepository.findByDocument(query.documentType, query.documentNumber);
    }
}
