import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanInstallmentRepository } from '../../domain/repositories/loan-installment.repository';
import { LoanInstallment } from '../../domain/entities/loan-installment.entity';
import { LoanInstallmentEntity } from './entities/loan-installment.entity';

@Injectable()
export class PostgresLoanInstallmentRepository implements LoanInstallmentRepository {
  constructor(
    @InjectRepository(LoanInstallmentEntity)
    private readonly repository: Repository<LoanInstallmentEntity>,
  ) { }

  async save(installment: LoanInstallment): Promise<string> {
    const entity = this.repository.create({
      loanId: installment.loanId,
      amount: installment.amount,
      userId: installment.userId,
      status: installment.status,
      installmentDate: installment.installmentDate,
      paymentType: installment.paymentType,
    });

    const saved = await this.repository.save(entity);
    return saved.id;
  }

  async findByLoanId(loanId: string): Promise<LoanInstallment[]> {
    const entities = await this.repository.find({
      where: { loanId },
      order: { installmentDate: 'DESC' },
    });

    return entities.map(
      (entity) =>
        new LoanInstallment(
          entity.loanId,
          entity.installmentDate,
          Number(entity.amount),
          entity.userId,
          entity.status,
          entity.id,
          undefined, // userName
          entity.paymentType,
        ),
    );
  }
  async findById(id: string): Promise<LoanInstallment | null> {
    const entity = await this.repository.findOneBy({ id });
    if (!entity) return null;

    return new LoanInstallment(
      entity.loanId,
      entity.installmentDate,
      Number(entity.amount),
      entity.userId,
      entity.status,
      entity.id,
      undefined, // userName
      entity.paymentType,
    );
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAllInDateRange(
    startDate: Date,
    endDate: Date,
    companyId?: string,
    userId?: string,
  ): Promise<LoanInstallment[]> {
    const qb = this.repository
      .createQueryBuilder('installment')
      .leftJoinAndSelect('installment.loan', 'loan')
      .leftJoinAndSelect('loan.person', 'person')
      .leftJoinAndSelect('loan.user', 'user')
      .where('DATE(installment.installmentDate) >= DATE(:startDate)', { startDate })
      .andWhere('DATE(installment.installmentDate) <= DATE(:endDate)', { endDate })
      .andWhere("installment.status = 'PAID'");

    if (userId) qb.andWhere('installment.userId = :userId', { userId });
    if (companyId) qb.andWhere('user.id_company = :companyId', { companyId });

    const entities = await qb.getMany();
    return entities.map((entity) => {
      const installment = new LoanInstallment(
        entity.loanId,
        entity.installmentDate,
        Number(entity.amount),
        entity.userId,
        entity.status,
        entity.id,
        entity.user?.username,
        entity.paymentType,
      );

      if (entity.loan) {
        // Asignamos una estructura parcial de Loan que cumpla lo requerido por el Handler
        (installment as any).loan = {
          person: entity.loan.person ? {
            firstName: entity.loan.person.firstName,
            lastName: entity.loan.person.lastName,
          } : undefined
        };
      }

      return installment;
    });
  }
}
