import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyRepository } from '../../domain/repositories/company.repository';
import { Company } from '../../domain/entities/company.entity';
import { CompanyEntity } from './entities/company.entity';

@Injectable()
export class PostgresCompanyRepository implements CompanyRepository {
    constructor(
        @InjectRepository(CompanyEntity)
        private readonly typeOrmRepository: Repository<CompanyEntity>,
    ) { }

    async save(company: Company): Promise<Company> {
        const entity = this.toEntity(company);
        const saved = await this.typeOrmRepository.save(entity);
        return this.toDomain(saved);
    }

    async findAll(): Promise<Company[]> {
        const entities = await this.typeOrmRepository.find({
            order: { createdAt: 'DESC' }
        });
        return entities.map(entity => this.toDomain(entity));
    }

    async findById(id: string): Promise<Company | null> {
        const entity = await this.typeOrmRepository.findOne({ where: { id } });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    async update(company: Company): Promise<void> {
        const entity = this.toEntity(company);
        await this.typeOrmRepository.save(entity);
    }

    private toEntity(company: Company): CompanyEntity {
        const entity = new CompanyEntity();
        if (company.id) {
            entity.id = company.id;
        }
        entity.companyName = company.companyName;
        entity.status = company.status;
        entity.createdAt = company.createdAt;
        return entity;
    }

    private toDomain(entity: CompanyEntity): Company {
        return new Company(
            entity.companyName,
            entity.status,
            new Date(entity.createdAt),
            entity.id,
        );
    }
}
