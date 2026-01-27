import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { Expense } from '../../domain/entities/expense.entity';
import { ExpenseEntity } from './entities/expense.entity';

@Injectable()
export class PostgresExpenseRepository implements ExpenseRepository {
    constructor(
        @InjectRepository(ExpenseEntity)
        private readonly typeOrmRepository: Repository<ExpenseEntity>,
    ) { }

    async save(expense: Expense): Promise<string> {
        const entity = this.toEntity(expense);
        const saved = await this.typeOrmRepository.save(entity);
        return saved.id;
    }

    async findById(id: string): Promise<Expense | null> {
        const entity = await this.typeOrmRepository.findOne({ where: { id } });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    async findAll(userId?: string, date?: Date): Promise<Expense[]> {
        const query = this.typeOrmRepository.createQueryBuilder('expense');
        query.where("expense.status != 'ELIMINADO'"); // Logical delete filter

        if (userId) {
            query.andWhere('expense.user_id = :userId', { userId });
        }

        if (date) {
            // Filter by date (ignoring time)
            query.andWhere('DATE(expense.expense_date) = DATE(:date)', { date });
        }

        const entities = await query.getMany();
        return entities.map(entity => this.toDomain(entity));
    }

    private toEntity(expense: Expense): ExpenseEntity {
        const entity = new ExpenseEntity();
        if (expense.id) {
            entity.id = expense.id;
        }
        entity.descripcion = expense.description;
        entity.amount = expense.amount;
        entity.userId = expense.userId;
        entity.expenseDate = expense.expenseDate;
        entity.status = expense.status;
        return entity;
    }

    private toDomain(entity: ExpenseEntity): Expense {
        return new Expense(
            entity.descripcion,
            Number(entity.amount),
            entity.userId,
            entity.expenseDate,
            entity.status,
            entity.id,
        );
    }
}
