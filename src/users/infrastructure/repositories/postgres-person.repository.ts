import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonRepository } from '../../domain/repositories/person.repository';
import { Person } from '../../domain/entities/person.entity';
import { PersonEntity } from './entities/person.entity';

@Injectable()
export class PostgresPersonRepository implements PersonRepository {
    constructor(
        @InjectRepository(PersonEntity)
        private readonly typeOrmRepository: Repository<PersonEntity>,
    ) { }

    async save(person: Person): Promise<string> {
        const entity = this.toEntity(person);
        const saved = await this.typeOrmRepository.save(entity);
        return saved.id;
    }

    async findByDocumentNumber(documentNumber: string): Promise<Person | null> {
        const entity = await this.typeOrmRepository.findOneBy({ documentNumber });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    async findById(id: string): Promise<Person | null> {
        const entity = await this.typeOrmRepository.findOneBy({ id });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    private toEntity(person: Person): PersonEntity {
        const entity = new PersonEntity();
        if (person.id) {
            entity.id = person.id;
        }
        entity.documentType = person.documentType;
        entity.documentNumber = person.documentNumber;
        entity.firstName = person.firstName;
        entity.lastName = person.lastName;
        entity.birthday = person.birthday;
        return entity;
    }

    private toDomain(entity: PersonEntity): Person {
        return new Person(
            entity.documentType,
            entity.documentNumber,
            entity.firstName,
            entity.lastName,
            entity.birthday,
            entity.id,
        );
    }
}
