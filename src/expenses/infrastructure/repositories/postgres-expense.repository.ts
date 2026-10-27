import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseRepository } from '@expenses/domain/repositories/expense.repository';
import { Expense } from '@expenses/domain/entities/expense.entity';
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
    const entity = await this.typeOrmRepository.findOne({
      where: { id },
      relations: ['user', 'user.person'],
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findAll(userId?: string, date?: Date, companyId?: string): Promise<Expense[]> {
    const query = this.typeOrmRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .leftJoinAndSelect('user.person', 'person')
      .where("expense.status != 'ELIMINADO'");

    if (companyId) {
      query.andWhere('expense.id_company = :companyId', { companyId });
    }

    if (userId) {
      query.andWhere('expense.user_id = :userId', { userId });
    }

    if (date) {
      // Filter by date (ignoring time)
      query.andWhere('DATE(expense.expense_date) = DATE(:date)', { date });
    }

    query.orderBy('expense.expense_date', 'DESC');

    const entities = await query.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllInDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string,
    companyId?: string,
  ): Promise<Expense[]> {
    const qb = this.typeOrmRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .leftJoinAndSelect('user.person', 'person')
      .where("expense.status != 'ELIMINADO'")
      .andWhere('DATE(expense.expense_date) >= DATE(:startDate)', { startDate })
      .andWhere('DATE(expense.expense_date) <= DATE(:endDate)', { endDate });

    if (companyId) {
      qb.andWhere('expense.id_company = :companyId', { companyId });
    }

    if (userId) {
      qb.andWhere('expense.user_id = :userId', { userId });
    }

    qb.orderBy('expense.expense_date', 'DESC');

    const entities = await qb.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  private toEntity(expense: Expense): ExpenseEntity {
    const entity = new ExpenseEntity();
    if (expense.id) {
      entity.id = expense.id;
    }
    entity.descripcion = expense.description;
    entity.amount = expense.amount;
    entity.userId = expense.userId;
    entity.idCompany = expense.companyId;
    entity.expenseDate = expense.expenseDate;
    entity.status = expense.status;
    return entity;
  }

  private toDomain(entity: ExpenseEntity): Expense {
    const person = entity.user?.person;
    const userFullName = person
      ? `${person.firstName || ''} ${person.lastName || ''}`.trim()
      : undefined;

    return new Expense(
      entity.descripcion,
      Number(entity.amount),
      entity.userId,
      entity.expenseDate,
      entity.status,
      entity.idCompany,
      entity.id,
      entity.user?.username,
      userFullName || undefined,
    );
  }
}
