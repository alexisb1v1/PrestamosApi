import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCompanyStatusCommand } from '../update-company-status.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import {
    CompanyRepository,
    CompanyRepositoryToken,
} from '../../../../domain/repositories/company.repository';

@CommandHandler(UpdateCompanyStatusCommand)
export class UpdateCompanyStatusHandler implements ICommandHandler<UpdateCompanyStatusCommand> {
    constructor(
        @Inject(CompanyRepositoryToken)
        private readonly companyRepository: CompanyRepository,
    ) { }

    async execute(command: UpdateCompanyStatusCommand): Promise<void> {
        const company = await this.companyRepository.findById(command.id);

        if (!company) {
            throw new HttpException('Empresa no encontrada', HttpStatus.NOT_FOUND);
        }

        // Validar status permitido si fuera necesario, por ahora aceptamos lo que venga del request validado por DTO
        company.status = command.status.toUpperCase();

        await this.companyRepository.update(company);
    }
}
