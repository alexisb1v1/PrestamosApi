import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRepository } from '../../domain/repositories/loan.repository';
import { Loan } from '../../domain/entities/loan.entity';
import { LoanInstallment } from '../../domain/entities/loan-installment.entity';
import { Person } from '../../../users/domain/entities/person.entity';
import { User } from '../../../users/domain/entities/user.entity';
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
        const entities = await this.typeOrmRepository.find({
            relations: ['person', 'user']
        });
        return entities.map(entity => this.toDomain(entity));
    }

    async findById(id: string): Promise<Loan | null> {
        const entity = await this.typeOrmRepository.findOne({
            where: { id },
            relations: ['person', 'user']
        });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    async findAllWithFilters(userId?: number, documentNumber?: string): Promise<Loan[]> {
        const queryBuilder = this.typeOrmRepository.createQueryBuilder('loan')
            .leftJoinAndSelect('loan.person', 'person')
            .leftJoinAndSelect('loan.user', 'user')
            .addSelect(subQuery => {
                return subQuery
                    .select('COUNT(*)')
                    .from('loan_installments', 'installment')
                    .where('installment.loan_id = loan.id')
                    .andWhere('installment.installment_date::date = CURRENT_DATE');
            }, 'paidTodayCount')
            .addSelect(subQuery => {
                return subQuery
                    .select('SUM(installment.amount)')
                    .from('loan_installments', 'installment')
                    .where('installment.loan_id = loan.id');
            }, 'installmentsSum');

        if (userId) {
            queryBuilder.andWhere('loan.userId = :userId', { userId });
        }

        if (documentNumber) {
            queryBuilder.andWhere('person.documentNumber = :documentNumber', { documentNumber });
        }

        const { entities, raw } = await queryBuilder.getRawAndEntities();

        return entities.map((entity, index) => {
            const loan = this.toDomain(entity);
            loan.paidToday = parseInt(raw[index].paidTodayCount) > 0 ? 1 : 0;
            const installmentsSum = parseFloat(raw[index].installmentsSum || '0');
            loan.remainingAmount = (loan.amount + loan.interest) - installmentsSum;
            return loan;
        });
    }

    async findActiveByPersonId(personId: string): Promise<Loan | null> {
        const entity = await this.typeOrmRepository.findOne({
            where: {
                idPeople: personId,
                status: 'Activo'
            }
        });

        if (!entity) return null;
        return this.toDomain(entity);
    }

    async findWithInstallments(id: string): Promise<Loan | null> {
        const entity = await this.typeOrmRepository.findOne({
            where: { id },
            relations: ['person', 'user', 'installments', 'installments.user']
        });

        if (!entity) return null;

        const loan = this.toDomain(entity);
        if (entity.installments) {
            loan.installments = entity.installments.map(inst => new LoanInstallment(
                inst.loanId,
                inst.installmentDate,
                Number(inst.amount),
                inst.userId,
                inst.status,
                inst.id,
                inst.user?.username
            ));
        }

        return loan;
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
        entity.days = loan.days;
        entity.createdAt = loan.createdAt;
        entity.userId = loan.userId.toString();
        entity.status = loan.status;
        entity.address = loan.address;
        return entity;
    }

    private toDomain(entity: LoanEntity): Loan {
        const loan = new Loan(
            Number(entity.idPeople),
            new Date(entity.startDate),
            new Date(entity.endDate),
            Number(entity.amount),
            Number(entity.interest),
            Number(entity.fee),
            entity.days,
            new Date(entity.createdAt),
            Number(entity.userId),
            entity.status,
            entity.address,
            entity.id,
        );

        if (entity.person) {
            loan.person = new Person(
                entity.person.documentType,
                entity.person.documentNumber,
                entity.person.firstName,
                entity.person.lastName,
                new Date(entity.person.birthday),
                entity.person.id
            );
        }

        if (entity.user) {
            // Minimal mapping for User, matching User domain entity
            loan.user = new User(
                entity.user.username,
                entity.user.passwordHash,
                entity.user.profile,
                entity.user.status,
                Number(entity.user.idPeople),
                entity.user.id
            );
        }

        return loan;
    }
}
