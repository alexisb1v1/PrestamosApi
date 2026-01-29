import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCompanyCommand } from '../create-company.command';
import { Inject } from '@nestjs/common';
import { CompanyRepository, CompanyRepositoryToken } from '../../../../domain/repositories/company.repository';
import { Company } from '../../../../domain/entities/company.entity';

@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler implements ICommandHandler<CreateCompanyCommand> {
    constructor(
        @Inject(CompanyRepositoryToken)
        private readonly companyRepository: CompanyRepository,
    ) { }

    async execute(command: CreateCompanyCommand): Promise<string> {
        const company = new Company(
            command.companyName,
            'ACTIVO',
            new Date(),
        );

        const saved = await this.companyRepository.save(company);
        return saved.id!;
    }
}
