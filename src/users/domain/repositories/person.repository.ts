import { Person } from '../entities/person.entity';

export interface PersonRepository {
  save(person: Person): Promise<string>; // Returns the generated ID
  findByDocument(
    documentType: string,
    documentNumber: string,
  ): Promise<Person | null>;
  findByDocumentNumber(documentNumber: string): Promise<Person | null>;
  findById(id: string): Promise<Person | null>;
}

export const PersonRepository = Symbol('PersonRepository');
