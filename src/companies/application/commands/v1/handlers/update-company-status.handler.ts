import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCompanyStatusCommand } from '../update-company-status.command';
import { Inject } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(UpdateCompanyStatusCommand)
export class UpdateCompanyStatusHandler implements ICommandHandler<UpdateCompanyStatusCommand, Result<void, AppError>> {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(command: UpdateCompanyStatusCommand): Promise<Result<void, AppError>> {
    const company = await this.companyRepository.findById(command.id);
    if (!company) {
      return err('NOT_FOUND');
    }

    company.status = command.status.toUpperCase();
    await this.companyRepository.update(company);
    return ok(undefined);
  }
}
