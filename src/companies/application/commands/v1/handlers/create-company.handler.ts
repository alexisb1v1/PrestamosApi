import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCompanyCommand } from '../create-company.command';
import { Inject } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';
import { Company } from '../../../../domain/entities/company.entity';
import { Result, ok } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler implements ICommandHandler<CreateCompanyCommand, Result<string, AppError>> {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(command: CreateCompanyCommand): Promise<Result<string, AppError>> {
    const company = new Company(command.companyName, 'ACTIVE', new Date());
    const saved = await this.companyRepository.save(company);
    return ok(saved.id!);
  }
}
