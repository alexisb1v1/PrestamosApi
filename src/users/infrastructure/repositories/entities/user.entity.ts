import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PersonEntity } from './person.entity';

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
}
