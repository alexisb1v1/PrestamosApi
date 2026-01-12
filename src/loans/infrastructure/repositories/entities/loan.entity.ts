import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PersonEntity } from '../../../../users/infrastructure/repositories/entities/person.entity';
import { UserEntity } from '../../../../users/infrastructure/repositories/entities/user.entity';

@Entity('loans')
export class LoanEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string; // TypeORM maps bigint to string to ensure precision

    @Column({ name: 'id_people', type: 'bigint' })
    idPeople: string;

    @ManyToOne(() => PersonEntity, { createForeignKeyConstraints: false })
    @JoinColumn({ name: 'id_people' })
    person: PersonEntity;

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
}
