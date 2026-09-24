import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { Person } from '@users/domain/entities/person.entity';
import { PersonEntity } from './entities/person.entity';

@Injectable()
export class PostgresPersonRepository implements PersonRepository {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly typeOrmRepository: Repository<PersonEntity>,
  ) {}

  async save(person: Person): Promise<string> {
    const entity = this.toEntity(person);
    const saved = await this.typeOrmRepository.save(entity);
    return saved.id;
  }

  async findByDocument(
    documentType: string,
    documentNumber: string,
  ): Promise<Person | null> {
    const entity = await this.typeOrmRepository.findOneBy({
      documentType,
      documentNumber,
    });
    if (!entity) return null;

    const latestData = await this.typeOrmRepository.manager.query(
      `
      SELECT 
        (SELECT phone FROM loans WHERE id_people = $1 AND phone IS NOT NULL AND phone != '' ORDER BY created_at DESC LIMIT 1) as phone,
        (SELECT address FROM loans WHERE id_people = $1 AND address IS NOT NULL AND address != '' ORDER BY created_at DESC LIMIT 1) as address
      `,
      [entity.id],
    );

    const person = this.toDomain(entity);
    if (latestData && latestData.length > 0) {
      if (latestData[0].phone) person.phone = latestData[0].phone;
      if (latestData[0].address) person.address = latestData[0].address;
    }

    return person;
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
    entity.creditScore = person.creditScore ?? 100;
    entity.suggestedLimit = person.suggestedLimit ?? null;
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
      undefined,
      undefined,
      entity.creditScore,
      entity.suggestedLimit ? Number(entity.suggestedLimit) : null,
    );
  }
}
