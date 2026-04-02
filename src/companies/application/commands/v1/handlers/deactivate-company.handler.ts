import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeactivateCompanyCommand } from '../deactivate-company.command';
import { Inject } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(DeactivateCompanyCommand)
export class DeactivateCompanyHandler implements ICommandHandler<DeactivateCompanyCommand, Result<void, AppError>> {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(command: DeactivateCompanyCommand): Promise<Result<void, AppError>> {
    const company = await this.companyRepository.findById(command.id);
    if (!company) {
      return err('NOT_FOUND');
    }

    company.status = 'INACTIVE';
    await this.companyRepository.update(company);
    return ok(undefined);
  }
}
