import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeactivateCompanyCommand } from '../deactivate-company.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';

@CommandHandler(DeactivateCompanyCommand)
export class DeactivateCompanyHandler implements ICommandHandler<DeactivateCompanyCommand> {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(command: DeactivateCompanyCommand): Promise<void> {
    const company = await this.companyRepository.findById(command.id);

    if (!company) {
      throw new HttpException('Empresa no encontrada', HttpStatus.NOT_FOUND);
    }

    company.status = 'INACTIVO';

    await this.companyRepository.update(company);
  }
}
