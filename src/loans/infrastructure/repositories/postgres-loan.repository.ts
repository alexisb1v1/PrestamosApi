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
            relations: ['person', 'user'],
        });

        if (!entity) return null;

        const loan = this.toDomain(entity);
        return loan;
    }

    async findAllWithFilters(userId?: number, documentNumber?: string, companyId?: number): Promise<Loan[]> {
        // Optimized: Using DATE_TRUNC for index-friendly date comparisons
        const todayStartSql = "DATE_TRUNC('day', NOW() AT TIME ZONE 'America/Lima')";
        const todayEndSql = "DATE_TRUNC('day', NOW() AT TIME ZONE 'America/Lima') + INTERVAL '1 day'";

        const qb = this.typeOrmRepository
            .createQueryBuilder('loan')
            .leftJoinAndSelect('loan.person', 'person')
            .leftJoinAndSelect('loan.user', 'user')
            .leftJoin('loan.installments', 'installment')
            .addSelect('COALESCE(SUM(installment.amount), 0)', 'installmentsSum')
            .addSelect(
                `
      MAX(
        CASE WHEN installment.installment_date >= ${todayStartSql}
          AND installment.installment_date < ${todayEndSql}
        THEN 1 ELSE 0 END
      )
      `,
                'paidToday'
            )
            .addSelect(
                `
      CASE WHEN ${todayStartSql} >= loan.start_date
        AND ${todayStartSql} < loan.end_date
      THEN 1 ELSE 0 END
      `,
                'inIntervalPayment'
            )
            .groupBy('loan.id')
            .addGroupBy('person.id')
            .addGroupBy('"user".id');

        if (userId) qb.andWhere('loan.userId = :userId', { userId });
        if (documentNumber) qb.andWhere('person.documentNumber = :documentNumber', { documentNumber });
        if (companyId) qb.andWhere('"user".id_company = :companyId', { companyId });

        const { entities, raw } = await qb.getRawAndEntities();

        return entities.map((entity, index) => {
            const loan = this.toDomain(entity);

            const installmentsSum = Number(raw[index].installmentsSum ?? 0);
            loan.remainingAmount = (loan.amount + loan.interest) - installmentsSum;

            loan.paidToday = Number(raw[index].paidToday ?? 0);
            loan.inIntervalPayment = Number(raw[index].inIntervalPayment ?? 0);

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
                entity.user.id,
                entity.user.isDayClosed,
                entity.user.idCompany
            );
        }

        return loan;
    }

    async getDashboardStats(userId?: string, companyId?: string): Promise<any> {
        // Optimized: Using DATE_TRUNC for index-friendly date comparisons
        const todayStartSql = "DATE_TRUNC('day', NOW() AT TIME ZONE 'America/Lima')";
        const todayEndSql = "DATE_TRUNC('day', NOW() AT TIME ZONE 'America/Lima') + INTERVAL '1 day'";

        // -------------------------------
        // 1) KPIs en una sola query
        // -------------------------------
        const kpisQb = this.typeOrmRepository.manager
            .createQueryBuilder()
            .select([
                `COALESCE(SUM(CASE WHEN loan.created_at >= ${todayStartSql} AND loan.created_at < ${todayEndSql} THEN loan.amount ELSE 0 END), 0) AS "totalLentToday"`,
                `COALESCE(SUM(CASE WHEN installment.installment_date >= ${todayStartSql} AND installment.installment_date < ${todayEndSql} THEN installment.amount ELSE 0 END), 0) AS "collectedToday"`,
                `COALESCE(SUM(CASE WHEN installment.installment_date >= ${todayStartSql} AND installment.installment_date < ${todayEndSql} AND UPPER(installment.payment_type) = 'YAPE' THEN installment.amount ELSE 0 END), 0) AS "collectedTodayYape"`,
                `COALESCE(SUM(CASE WHEN installment.installment_date >= ${todayStartSql} AND installment.installment_date < ${todayEndSql} AND UPPER(installment.payment_type) IN ('EFECTIVO', 'CASH') THEN installment.amount ELSE 0 END), 0) AS "collectedTodayCash"`,
                `COUNT(DISTINCT CASE WHEN loan.status = 'Activo' THEN loan.id_people ELSE NULL END) AS "activeClients"`,
            ])
            .from('loans', 'loan')
            .leftJoin('loan_installments', 'installment', 'installment.loan_id = loan.id')
            .leftJoin('user', 'u', 'loan.user_id = u.id');

        if (userId) {
            kpisQb.where('loan.user_id = :userId', { userId });
        }
        if (companyId) {
            kpisQb.andWhere('u.id_company = :companyId', { companyId });
        }

        const kpisRaw = await kpisQb.getRawOne();

        // -------------------------------
        // 2) Pending loans (no pago hoy)
        // - calculamos installmentsSum con join + groupBy (no subquery por loan)
        // -------------------------------
        const pendingQb = this.typeOrmRepository
            .createQueryBuilder('loan')
            .leftJoinAndSelect('loan.person', 'person')
            .leftJoinAndSelect('loan.user', 'user')
            .leftJoin('loan.installments', 'allInstallments')
            .leftJoin(
                'loan.installments',
                'todayInstallment',
                `"todayInstallment".installment_date >= ${todayStartSql} AND "todayInstallment".installment_date < ${todayEndSql}`
            )
            .where("loan.status = 'Activo'")
            .andWhere(`${todayStartSql} >= loan.start_date AND ${todayStartSql} < loan.end_date`)
            .andWhere('"todayInstallment".id IS NULL') // no pago hoy
            .addSelect('COALESCE(SUM(allInstallments.amount), 0)', 'installmentsSum')
            .groupBy('loan.id')
            .addGroupBy('person.id')
            .addGroupBy('"user".id');

        if (userId) {
            pendingQb.andWhere('loan.userId = :userId', { userId });
        }
        if (companyId) {
            pendingQb.andWhere('"user".id_company = :companyId', { companyId });
        }

        const pendingRaw = await pendingQb.getRawAndEntities();

        const pendingLoans = pendingRaw.entities.map((entity, index) => {
            const loan = this.toDomain(entity);

            const installmentsSum = Number(pendingRaw.raw[index].installmentsSum ?? 0);
            loan.remainingAmount = (loan.amount + loan.interest) - installmentsSum;

            loan.paidToday = 0;
            loan.inIntervalPayment = 1;

            return loan;
        });

        // -------------------------------
        // 3) Total Expenses Today
        // -------------------------------
        const expensesQb = this.typeOrmRepository.manager
            .createQueryBuilder()
            .select('COALESCE(SUM(expense.amount), 0)', 'totalExpenses')
            .from('expenses', 'expense')
            .leftJoin('user', 'u', 'expense.user_id = u.id')
            .where(`expense.expense_date >= ${todayStartSql} AND expense.expense_date < ${todayEndSql}`)
            .andWhere("expense.status = 'REGISTERED'");

        if (userId) {
            expensesQb.andWhere('expense.user_id = :userId', { userId });
        }
        if (companyId) {
            expensesQb.andWhere('u.id_company = :companyId', { companyId });
        }

        const expensesRaw = await expensesQb.getRawOne();


        return {
            totalLentToday: Number(kpisRaw?.totalLentToday ?? 0),
            collectedToday: Number(kpisRaw?.collectedToday ?? 0),
            totalExpensesToday: Number(expensesRaw?.totalExpenses ?? 0),
            detailCollectedToday: {
                yape: Number(kpisRaw?.collectedTodayYape ?? 0),
                efectivo: Number(kpisRaw?.collectedTodayCash ?? 0),
            },
            activeClients: Number(kpisRaw?.activeClients ?? 0),
            pendingLoans,
        };
    }
}
