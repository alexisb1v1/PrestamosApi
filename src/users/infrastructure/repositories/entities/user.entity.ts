import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}
