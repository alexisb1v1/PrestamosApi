import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('loans')
export class LoanEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string; // TypeORM maps bigint to string to ensure precision

    @Column({ name: 'id_people', type: 'bigint' })
    idPeople: string;

    @Column({ name: 'start_date', type: 'date' })
    startDate: string | Date;

    @Column({ name: 'end_date', type: 'date' })
    endDate: string | Date;

    @Column('numeric', { precision: 12, scale: 2 })
    amount: number;

    @Column('numeric', { precision: 12, scale: 2 })
    interest: number;

    @Column('numeric', { precision: 12, scale: 2 })
    fee: number;

    @Column({ name: 'created_at', type: 'date', default: () => 'CURRENT_DATE' })
    createdAt: string | Date;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: string;

    @Column({ length: 15, default: 'PENDING' })
    status: string;
}
