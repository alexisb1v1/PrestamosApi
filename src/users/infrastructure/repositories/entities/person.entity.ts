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

    @Column({ type: 'date' })
    birthday: Date;
}
