import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PersonEntity } from './person.entity';
import { CompanyEntity } from '../../../../companies/infrastructure/repositories/entities/company.entity';

@Entity('user')
export class UserEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @Column({ length: 50 })
    username: string;

    @Column({ name: 'password_hash', length: 255 })
    passwordHash: string;

    @Column({ length: 20 })
    profile: string;

    @Column({ length: 10 })
    status: string;

    @Column({ name: 'id_people', type: 'bigint' })
    idPeople: string;

    @ManyToOne(() => PersonEntity)
    @JoinColumn({ name: 'id_people' })
    person: PersonEntity;

    @Column({ name: 'is_day_closed', type: 'boolean', default: false })
    isDayClosed: boolean;

    @Column({ name: 'id_company', type: 'bigint', nullable: true })
    idCompany: string;

    @ManyToOne(() => CompanyEntity)
    @JoinColumn({ name: 'id_company' })
    company: CompanyEntity;
}
