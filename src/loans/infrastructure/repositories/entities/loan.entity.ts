import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PersonEntity } from '@users/infrastructure/repositories/entities/person.entity';
import { UserEntity } from '@users/infrastructure/repositories/entities/user.entity';
import { LoanInstallmentEntity } from './loan-installment.entity';

@Entity('loans')
export class LoanEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string; // TypeORM maps bigint to string to ensure precision

  @Column({ name: 'id_people', type: 'bigint' })
  idPeople: string;

  @Column({ name: 'id_company', type: 'bigint', nullable: true })
  idCompany: string;

  @ManyToOne(() => PersonEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'id_people' })
  person: PersonEntity;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string | Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string | Date;

  @Column({ name: 'liquidation_date', type: 'timestamp', nullable: true })
  liquidationDate: string | Date | null;

  @Column('numeric', { precision: 12, scale: 2 })
  amount: number;

  @Column('numeric', { precision: 12, scale: 2 })
  interest: number;

  @Column('numeric', {
    name: 'interest_rate',
    precision: 5,
    scale: 2,
    default: 20.0,
  })
  interestRate: number;

  @Column('numeric', { precision: 12, scale: 2 })
  fee: number;

  @Column({ type: 'int', default: 24 })
  days: number;

  @Column({ name: 'created_at', type: 'date', default: () => 'CURRENT_DATE' })
  createdAt: string | Date;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ length: 15, default: 'PENDING' })
  status: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 20, nullable: false, default: '' })
  phone: string;

  @Column({ name: 'completed_on_time', type: 'boolean', default: false })
  completedOnTime: boolean;

  @Column({ name: 'early_liquidation_days', type: 'int', default: 0 })
  earlyLiquidationDays: number;

  @Column({ name: 'extension_days', type: 'int', default: 0 })
  extensionDays: number;

  @Column({ name: 'delay_days', type: 'int', default: 0 })
  delayDays: number;

  @Column({ name: 'credit_rating', type: 'varchar', length: 5, nullable: true })
  creditRating: string | null;

  @Column({ name: 'is_migrated', type: 'boolean', default: false })
  isMigrated: boolean;

  @Column({ name: 'migrated_at', type: 'timestamp', nullable: true })
  migratedAt: Date | null;

  @OneToMany(() => LoanInstallmentEntity, (installment) => installment.loan)
  installments: LoanInstallmentEntity[];
}

