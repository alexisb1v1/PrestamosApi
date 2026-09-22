import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { GetCompanyPublicInfoQuery } from '../get-company-public-info.query';
import { CompanyRepository, CompanyRepositoryToken } from '@companies/domain/repositories/company.repository';
import { AppError } from '@shared/errors/app-errors';

@QueryHandler(GetCompanyPublicInfoQuery)
export class GetCompanyPublicInfoHandler implements IQueryHandler<GetCompanyPublicInfoQuery, Result<{ companyName: string }, AppError>> {
  private readonly logger = new Logger(GetCompanyPublicInfoHandler.name);

  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(query: GetCompanyPublicInfoQuery): Promise<Result<{ companyName: string }, AppError>> {
    const { subdomain } = query;

    if (!subdomain) {
      return err('NOT_FOUND');
    }

    const company = await this.companyRepository.findBySubdomain(subdomain);

    if (!company) {
      return err('NOT_FOUND');
    }

    if (company.status !== 'ACTIVE') {
      return err('FORBIDDEN');
    }

    return ok({ companyName: company.companyName });
  }
}
