import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { Loan } from '../../domain/entities/loan.entity';
import { LoanEntity } from './entities/loan.entity';

@Injectable()
export class PostgresLoanRepository implements LoanRepository {
    constructor(
        @InjectRepository(LoanEntity)
        private readonly typeOrmRepository: Repository<LoanEntity>,
    ) { }

    async save(loan: Loan): Promise<void> {
        const entity = this.toEntity(loan);
        await this.typeOrmRepository.save(entity);
    }

    async findAll(): Promise<Loan[]> {
        const entities = await this.typeOrmRepository.find();
        return entities.map(this.toDomain);
    }

    async findById(id: string): Promise<Loan | null> {
        const entity = await this.typeOrmRepository.findOneBy({ id });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    private toEntity(loan: Loan): LoanEntity {
        const entity = new LoanEntity();
        if (loan.id) {
            entity.id = loan.id;
        }
        entity.idPeople = loan.idPeople.toString();
        entity.startDate = loan.startDate;
        entity.endDate = loan.endDate;
        entity.amount = loan.amount;
        entity.interest = loan.interest;
        entity.fee = loan.fee;
        entity.createdAt = loan.createdAt;
        entity.userId = loan.userId.toString();
        entity.status = loan.status;
        return entity;
    }

    private toDomain(entity: LoanEntity): Loan {
        return new Loan(
            Number(entity.idPeople),
            new Date(entity.startDate),
            new Date(entity.endDate),
            Number(entity.amount),
            Number(entity.interest),
            Number(entity.fee),
            new Date(entity.createdAt),
            Number(entity.userId),
            entity.status,
            entity.id,
        );
    }
}
