import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListCompaniesQuery } from '../list-companies.query';
import { Inject } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { CompanyAppDto } from '../dto/company-app.dto';
import { CompanyMapper } from '../mappers/company.mapper';
import { Result, ok } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@QueryHandler(ListCompaniesQuery)
export class ListCompaniesHandler implements IQueryHandler<ListCompaniesQuery, Result<CompanyAppDto[], AppError>> {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_query: ListCompaniesQuery): Promise<Result<CompanyAppDto[], AppError>> {
    const companies = await this.companyRepository.findAll();
    return ok(companies.map(c => CompanyMapper.toAppDto(c)));
  }
}
