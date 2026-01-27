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

    @Column({ name: 'installment_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
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

    @Column({ name: 'payment_type', type: 'character varying', length: 10, nullable: true })
    paymentType: string;
}
