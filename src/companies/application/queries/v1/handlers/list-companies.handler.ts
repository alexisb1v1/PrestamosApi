import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListCompaniesQuery } from '../list-companies.query';
import { Inject } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Company } from '../../../../domain/entities/company.entity';

@QueryHandler(ListCompaniesQuery)
export class ListCompaniesHandler implements IQueryHandler<ListCompaniesQuery> {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_query: ListCompaniesQuery): Promise<Company[]> {
    return this.companyRepository.findAll();
  }
}
