import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { LoanEntity } from './loan.entity';
import { UserEntity } from '../../../../users/infrastructure/repositories/entities/user.entity';

@Entity('loan_installments')
export class LoanInstallmentEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @Column({ name: 'loan_id', type: 'bigint' })
    loanId: string;

    @ManyToOne(() => LoanEntity, { createForeignKeyConstraints: false })
    @JoinColumn({ name: 'loan_id' })
    loan: LoanEntity;

    @CreateDateColumn({ name: 'installment_date', type: 'timestamp' })
    installmentDate: Date;

    @Column('numeric', { precision: 12, scale: 2 })
    amount: number;

    @Column({ length: 15, default: 'ACTIVE' })
    status: string;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: string;

    @ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
}
