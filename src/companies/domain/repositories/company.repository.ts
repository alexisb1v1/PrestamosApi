import { Company } from '../entities/company.entity';

export abstract class CompanyRepository {
  abstract save(company: Company): Promise<Company>;
  abstract findAll(): Promise<Company[]>;
  abstract findById(id: string): Promise<Company | null>;
  abstract update(company: Company): Promise<void>;
}

export const CompanyRepositoryToken = Symbol('CompanyRepository');
