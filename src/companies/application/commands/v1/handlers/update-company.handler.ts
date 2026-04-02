import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCompanyCommand } from '../update-company.command';
import { Inject } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<UpdateCompanyCommand, Result<void, AppError>> {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(command: UpdateCompanyCommand): Promise<Result<void, AppError>> {
    const company = await this.companyRepository.findById(command.id);
    if (!company) {
      return err('NOT_FOUND');
    }

    company.companyName = command.companyName;
    await this.companyRepository.update(company);
    return ok(undefined);
  }
}
