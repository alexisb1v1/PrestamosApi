import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('company')
export class CompanyEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @Column({ name: 'company_name', type: 'character varying', nullable: true })
    companyName: string;

    @Column({ name: 'status', type: 'character varying', length: 10, default: 'ACTIVO' })
    status: string;

    @Column({ name: 'create_at', type: 'date', default: () => 'CURRENT_DATE' })
    createdAt: Date;

    @Column({ name: 'label', type: 'character varying', nullable: true })
    label?: string;
}
