import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CreditScoreCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CreditScoreCronService.name);

  constructor(private readonly dataSource: DataSource) {}

  onApplicationBootstrap() {
    // Run the cron every night at 1:00 AM (local time)
    this.scheduleNightlyJob();
  }

  private scheduleNightlyJob() {
    const runJob = async () => {
      try {
        this.logger.log('Iniciando cálculo nocturno de Semáforo Crediticio...');
        await this.processCreditScores();
        this.logger.log('Cálculo de Semáforo Crediticio finalizado con éxito.');
      } catch (err) {
        this.logger.error('Error al ejecutar cálculo de Semáforo Crediticio', err);
      }
    };

    setInterval(
      () => {
        const now = new Date();
        if (now.getHours() === 1 && now.getMinutes() === 0) {
          runJob();
        }
      },
      60 * 1000,
    ); // every 1 minute
  }

  async processCreditScores() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    await queryRunner.startTransaction();
    try {
      /*
        Business Rules for Penalties:
        - We evaluate ALL active loans (status = 'Pendiente').
        - Calculate consecutive late days
        - 1-3 days late: -1 pt
        - 4-7 days late: -2 pts
        - 8-14 days late: -4 pts
      */
      
      // We calculate late days as days_since_start - paid_days
      await queryRunner.query(`
        WITH late_loans AS (
          SELECT 
            l.id_people,
            l.id as loan_id,
            l.fee,
            l.status,
            COALESCE((SELECT SUM(amount) FROM payments p WHERE p.loan_id = l.id), 0) as total_paid,
            DATE_PART('day', NOW() - l.start_date) as days_since_start
          FROM loans l
          WHERE l.status = 'Pendiente' AND l.fee > 0
        ),
        calculated_mora AS (
          SELECT 
            id_people,
            FLOOR(days_since_start - (total_paid / fee)) as late_days
          FROM late_loans
          WHERE FLOOR(days_since_start - (total_paid / fee)) >= 1
        ),
        penalties AS (
          SELECT 
            id_people,
            SUM(
              CASE 
                WHEN late_days BETWEEN 1 AND 3 THEN 1
                WHEN late_days BETWEEN 4 AND 7 THEN 2
                WHEN late_days >= 8 THEN 4
                ELSE 0
              END
            ) as total_penalty
          FROM calculated_mora
          GROUP BY id_people
        )
        UPDATE people p
        SET credit_score = GREATEST(0, p.credit_score - pen.total_penalty)
        FROM penalties pen
        WHERE p.id = pen.id_people;
      `);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async applySaturdayEffect(personId: string | number, recoveredDays: number) {
    const recoveredPoints = Math.floor(recoveredDays * 0.8 * 2);
    await this.dataSource.query(
      `UPDATE people SET credit_score = LEAST(100, credit_score + $1) WHERE id = $2`,
      [recoveredPoints, personId]
    );
  }
}
