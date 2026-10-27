import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyEntity } from '@companies/infrastructure/repositories/entities/company.entity';
import { UserEntity } from '@users/infrastructure/repositories/entities/user.entity';

@Entity('expenses')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 200 })
  descripcion: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ name: 'id_company', type: 'bigint' })
  idCompany: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'id_company' })
  company: CompanyEntity;

  @Column({ name: 'expense_date', type: 'timestamp' })
  expenseDate: Date;

  @Column({ length: 15 })
  status: string;
}

