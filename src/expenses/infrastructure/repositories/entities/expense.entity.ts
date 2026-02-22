import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ name: 'expense_date', type: 'timestamp' })
  expenseDate: Date;

  @Column({ length: 15 })
  status: string;
}
