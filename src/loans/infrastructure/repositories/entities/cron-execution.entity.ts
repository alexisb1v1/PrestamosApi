import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('cron_executions')
export class CronExecutionEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'job_name', type: 'varchar', length: 100 })
  jobName: string;

  @Column({
    name: 'trigger_type',
    type: 'varchar',
    length: 20,
    default: 'SCHEDULED',
  })
  triggerType: 'SCHEDULED' | 'MANUAL';

  @Column({ name: 'status', type: 'varchar', length: 20 })
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';

  @CreateDateColumn({
    name: 'started_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startedAt: Date;

  @Column({
    name: 'finished_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  finishedAt?: Date;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs?: number;

  @Column({
    name: 'liquidated_processed',
    type: 'int',
    default: 0,
    nullable: true,
  })
  liquidatedProcessed: number;

  @Column({
    name: 'active_processed',
    type: 'int',
    default: 0,
    nullable: true,
  })
  activeProcessed: number;

  @Column({
    name: 'total_processed',
    type: 'int',
    default: 0,
    nullable: true,
  })
  totalProcessed: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'details', type: 'jsonb', nullable: true })
  details?: Record<string, any>;
}
