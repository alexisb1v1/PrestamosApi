import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCompanyCommand } from '../update-company.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CompanyRepository, CompanyRepositoryToken } from '../../../../domain/repositories/company.repository';

@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<UpdateCompanyCommand> {
    constructor(
        @Inject(CompanyRepositoryToken)
        private readonly companyRepository: CompanyRepository,
    ) { }

    async execute(command: UpdateCompanyCommand): Promise<void> {
        const company = await this.companyRepository.findById(command.id);

        if (!company) {
            throw new HttpException('Empresa no encontrada', HttpStatus.NOT_FOUND);
        }

        company.companyName = command.companyName;

        await this.companyRepository.update(company);
    }
}
