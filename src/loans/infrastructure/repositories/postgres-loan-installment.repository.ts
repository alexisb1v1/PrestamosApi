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

        return entities.map(entity => new LoanInstallment(
            entity.loanId,
            entity.installmentDate,
            Number(entity.amount),
            entity.userId,
            entity.status,
            entity.id,
            undefined, // userName
            entity.paymentType,
        ));
    }
}
