import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyRepository } from '@companies/domain/repositories/company.repository';
import { Company } from '@companies/domain/entities/company.entity';
import { CompanyEntity } from './entities/company.entity';
import * as crypto from 'crypto';

@Injectable()
export class PostgresCompanyRepository implements CompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly typeOrmRepository: Repository<CompanyEntity>,
  ) {}

  async save(company: Company): Promise<Company> {
    if (!company.keyToken) {
      company.keyToken = `cmp_${crypto.randomBytes(12).toString('hex')}`;
    }
    const entity = this.toEntity(company);
    const saved = await this.typeOrmRepository.save(entity);
    return this.toDomain(saved);
  }

  async findAll(): Promise<Company[]> {
    const entities = await this.typeOrmRepository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: string): Promise<Company | null> {
    const entity = await this.typeOrmRepository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByIdAndKeyToken(id: string, keyToken: string): Promise<Company | null> {
    const entity = await this.typeOrmRepository.findOne({ where: { id, keyToken } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findBySubdomain(subdomain: string): Promise<Company | null> {
    const entity = await this.typeOrmRepository.findOne({ where: { subdomain } });
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
    if (company.label) {
      entity.label = company.label;
    }
    if (company.subdomain) {
      entity.subdomain = company.subdomain;
    }
    if (company.keyToken) {
      entity.keyToken = company.keyToken;
    }
    entity.settings = company.settings || {};
    entity.isDemo = company.isDemo ?? false;
    return entity;
  }

  private toDomain(entity: CompanyEntity): Company {
    return new Company(
      entity.companyName,
      entity.status,
      new Date(entity.createdAt),
      entity.id,
      entity.label,
      entity.subdomain,
      entity.keyToken,
      entity.settings || {},
      entity.isDemo ?? false,
    );
  }
}
