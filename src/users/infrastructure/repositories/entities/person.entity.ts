import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('people')
export class PersonEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'document_type', length: 3 })
  documentType: string;

  @Column({ name: 'document_number', length: 15 })
  documentNumber: string;

  @Column({ name: 'first_name', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', length: 50 })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  birthday: Date | null;

  @Column({ name: 'credit_score', type: 'int', default: 85 })
  creditScore: number;

  @Column({ name: 'suggested_limit', type: 'decimal', precision: 10, scale: 2, nullable: true })
  suggestedLimit: number | null;

  @Column({ name: 'credit_score_detail', type: 'jsonb', nullable: true })
  creditScoreDetail: Record<string, any> | null;
}

