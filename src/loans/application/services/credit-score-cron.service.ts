import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  countWorkdaysDue,
  countWorkdaysBetween,
  calculateLoanLiquidationIndicators,
} from '../utils/workdays.util';

export interface ScoreDetailPayload {
  calculated_at: string;
  score: number;
  rating: 'A+' | 'A' | 'B' | 'C';
  rating_label: string;
  summary: {
    total_loans_count: number;
    liquidated_count: number;
    active_count: number;
    active_tenants_count: number;
    has_arrears: boolean;
    total_debt_amount: number;
    total_paid_amount: number;
  };
  pillars: {
    reputation_history: {
      score: number;
      max_score: number;
      weight_percent: number;
      liquidated_on_time_count: number;
      early_liquidated_count: number;
      liquidated_with_extension_count: number;
      avg_delay_days: number;
      is_new_customer: boolean;
      assessment: string;
    };
    active_punctuality: {
      score: number;
      max_score: number;
      weight_percent: number;
      active_delay_days: number;
      unpaid_installments_count: number;
      status: 'AL_DIA' | 'MORA_LEVE' | 'MORA_MODERADA' | 'MORA_GRAVE' | 'MORA_CRITICA';
      assessment: string;
    };
    debt_capacity: {
      score: number;
      max_score: number;
      weight_percent: number;
      active_loans_count: number;
      active_tenants_count: number;
      has_cross_tenant_arrears: boolean;
      status: 'OPTIMO' | 'MODERADO' | 'SOBRE_ENDEUDADO' | 'ALERTA_CRUZADA';
      assessment: string;
    };
  };
  recommendations: {
    status: 'APROBADO' | 'SUJETO_A_CONDICIONES' | 'BLOQUEADO';
    suggested_action: string;
    risk_level: 'MINIMO' | 'BAJO' | 'MEDIO' | 'ALTO';
  };
}

@Injectable()
export class CreditScoreCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CreditScoreCronService.name);

  constructor(private readonly dataSource: DataSource) { }

  async onApplicationBootstrap() {
    await this.ensureCronTableExists();
    this.scheduleNightlyJobs();
  }

  /**
   * Garantiza que la tabla de auditoría cron_executions exista en PostgreSQL.
   */
  async ensureCronTableExists(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS cron_executions (
          id BIGSERIAL PRIMARY KEY,
          job_name VARCHAR(100) NOT NULL,
          trigger_type VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
          status VARCHAR(20) NOT NULL,
          started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          finished_at TIMESTAMP WITH TIME ZONE NULL,
          duration_ms INT NULL,
          liquidated_processed INT DEFAULT 0,
          active_processed INT DEFAULT 0,
          total_processed INT DEFAULT 0,
          error_message TEXT NULL,
          details JSONB NULL
        );
      `);
    } catch (err) {
      this.logger.error('Error asegurando tabla cron_executions', err);
    }
  }

  /**
   * Obtiene el historial de ejecuciones de cron ordenado descendente.
   */
  async getCronExecutions(limit = 30): Promise<any[]> {
    await this.ensureCronTableExists();
    return await this.dataSource.query(
      `SELECT 
        id,
        job_name AS "jobName",
        trigger_type AS "triggerType",
        status,
        started_at AS "startedAt",
        finished_at AS "finishedAt",
        duration_ms AS "durationMs",
        liquidated_processed AS "liquidatedProcessed",
        active_processed AS "activeProcessed",
        total_processed AS "totalProcessed",
        error_message AS "errorMessage",
        details
      FROM cron_executions 
      ORDER BY started_at DESC 
      LIMIT $1`,
      [limit],
    );
  }

  /**
   * Programa la doble ventana de crons:
   * - 23:00 (11:00 PM): Cierre diario de préstamos activos (consolida mora en loans).
   * - 01:00 (1:00 AM): Evaluación integral de Central de Riesgos (recalcula score en people).
   */
  private scheduleNightlyJobs() {
    setInterval(async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Ventana 1: 23:00 (11:00 PM) - Cierre diario de préstamos
      if (hours === 23 && minutes === 0) {
        try {
          this.logger.log('Iniciando Cron 23:00 - Cierre Diario de Préstamos Activos...');
          await this.runDailyLoansClosingJob('SCHEDULED');
          this.logger.log('Cron 23:00 - Cierre Diario de Préstamos finalizado.');
        } catch (err) {
          this.logger.error('Error en Cron 23:00 (Cierre de Préstamos)', err);
        }
      }

      // Ventana 2: 01:00 (1:00 AM) - Actualización rápida de Score en People
      if (hours === 1 && minutes === 0) {
        try {
          this.logger.log('Iniciando Cron 01:00 - Central de Riesgos Global (People Score)...');
          await this.runNightlyCreditScoreJob();
          this.logger.log('Cron 01:00 - Central de Riesgos Global finalizado.');
        } catch (err) {
          this.logger.error('Error en Cron 01:00 (Central de Riesgos)', err);
        }
      }

      // Ventana 3: 02:00 (2:00 AM) - Limpieza y purga periódica de la empresa DEMO (ID 102)
      if (hours === 2 && minutes === 0) {
        try {
          this.logger.log('Iniciando Cron 02:00 - Limpieza y purga de cartera Demo (ID 102)...');
          await this.runDemoCompanyCleanupJob('SCHEDULED', 102, 4);
          this.logger.log('Cron 02:00 - Limpieza de empresa Demo finalizada exitosamente.');
        } catch (err) {
          this.logger.error('Error en Cron 02:00 (Limpieza Demo 102)', err);
        }
      }
    }, 60 * 1000); // Revisa cada 1 minuto
  }

  /**
   * Ventana 1 (23:00): Cierre diario de cartera de préstamos.
   * Rellena y actualiza los 5 campos analíticos en la tabla `loans`:
   * - completed_on_time
   * - early_liquidation_days
   * - extension_days
   * - delay_days
   * - credit_rating
   *
   * Procesa tanto créditos liquidados históricos/pendientes como créditos activos.
   */
  async runDailyLoansClosingJob(
    triggerType: 'SCHEDULED' | 'MANUAL' = 'SCHEDULED',
  ): Promise<{
    executionId: string;
    status: string;
    durationMs: number;
    liquidatedProcessed: number;
    activeProcessed: number;
    totalProcessed: number;
  }> {
    await this.ensureCronTableExists();
    const startTime = Date.now();

    const insertRes = await this.dataSource.query(
      `INSERT INTO cron_executions (job_name, trigger_type, status, started_at) 
       VALUES ($1, $2, 'RUNNING', NOW()) 
       RETURNING id`,
      ['DAILY_LOANS_CLOSING', triggerType],
    );
    const executionId = insertRes[0]?.id;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Backfill y consolidación de préstamos liquidados sin calificación crediticia
      const liquidatedLoans = await this.dataSource.query(`
      SELECT 
        l.id,
        l.start_date,
        l.end_date,
        l.liquidation_date,
        MAX(i.installment_date) AS last_payment_date
      FROM loans l
      LEFT JOIN loan_installments i ON i.loan_id = l.id AND i.status = 'PAID'
      LEFT JOIN company c ON c.id = l.id_company
      WHERE l.status = 'Liquidado' 
        AND (c.is_demo IS NOT TRUE)
      GROUP BY l.id, l.start_date, l.end_date, l.liquidation_date
    `);

      for (const loan of liquidatedLoans) {
        const liqDate = loan.liquidation_date || loan.last_payment_date || loan.end_date;
        const indicators = calculateLoanLiquidationIndicators(
          loan.start_date,
          loan.end_date,
          liqDate,
        );

        await this.dataSource.query(
          `UPDATE loans 
         SET completed_on_time = $1,
             early_liquidation_days = $2,
             extension_days = $3,
             delay_days = $4,
             credit_rating = $5,
             liquidation_date = COALESCE(liquidation_date, $6)
         WHERE id = $7`,
          [
            indicators.completedOnTime,
            indicators.earlyLiquidationDays,
            indicators.extensionDays,
            indicators.delayDays,
            indicators.creditRating,
            liqDate,
            loan.id,
          ],
        );
      }

      // 2. Procesamiento de préstamos activos
      const activeLoans = await this.dataSource.query(`
      SELECT 
        l.id,
        l.id_people,
        l.start_date,
        l.end_date,
        l.amount,
        l.interest,
        l.fee,
        COALESCE(SUM(i.amount), 0) AS total_paid,
        MAX(i.installment_date) AS last_payment_date
      FROM loans l
      LEFT JOIN loan_installments i ON i.loan_id = l.id AND i.status = 'PAID'
      LEFT JOIN company c ON c.id = l.id_company
      WHERE l.status = 'Activo'
        AND (c.is_demo IS NOT TRUE)
      GROUP BY l.id, l.id_people, l.start_date, l.end_date, l.amount, l.interest, l.fee
    `);

      for (const loan of activeLoans) {
        const totalLoan = Number(loan.amount) + Number(loan.interest);
        const totalPaid = Number(loan.total_paid) || 0;

        // 2.1 Si ya pagó la totalidad, liquidar formalmente
        if (totalPaid >= totalLoan) {
          const liqDate = loan.last_payment_date || today;
          const indicators = calculateLoanLiquidationIndicators(
            loan.start_date,
            loan.end_date,
            liqDate,
          );

          await this.dataSource.query(
            `UPDATE loans 
           SET status = 'Liquidado',
               liquidation_date = $1,
               completed_on_time = $2,
               early_liquidation_days = $3,
               extension_days = $4,
               delay_days = $5,
               credit_rating = $6
           WHERE id = $7`,
            [
              liqDate,
              indicators.completedOnTime,
              indicators.earlyLiquidationDays,
              indicators.extensionDays,
              indicators.delayDays,
              indicators.creditRating,
              loan.id,
            ],
          );
          continue;
        }

        // 2.2 Préstamo continúa activo con saldo pendiente
        const contractEndDate = new Date(loan.end_date);
        contractEndDate.setHours(0, 0, 0, 0);

        const isOverdueContract = contractEndDate < today;
        const extensionDays = isOverdueContract ? countWorkdaysBetween(loan.end_date, today) : 0;
        const completedOnTime = false;
        const earlyLiquidationDays = 0;

        const fee = Number(loan.fee) || 1;
        const remainingAmount = Math.max(0, totalLoan - totalPaid);
        const remainingInstallments = Math.ceil(remainingAmount / fee);

        let delayDays = 0;
        if (isOverdueContract) {
          // Fuera de plazo contractual: el retraso en cuotas es exactamente el saldo de cuotas impagas
          delayDays = remainingInstallments;
        } else {
          // En curso: evaluar cuotas exigibles a la fecha menos lo amortizado
          const workdaysDue = countWorkdaysDue(loan.start_date, today);
          const paidInstallments = totalPaid / fee;
          delayDays = Math.max(0, Math.min(remainingInstallments, Math.floor(workdaysDue - paidInstallments)));
        }

        let creditRating: 'A' | 'B' | 'C' = 'A';
        if (delayDays > 3 || extensionDays > 3) {
          creditRating = 'C';
        } else if (delayDays > 0 || extensionDays > 0) {
          creditRating = 'B';
        }

        await this.dataSource.query(
          `UPDATE loans 
         SET completed_on_time = $1,
             early_liquidation_days = $2,
             extension_days = $3,
             delay_days = $4,
             credit_rating = $5
         WHERE id = $6`,
          [
            completedOnTime,
            earlyLiquidationDays,
            extensionDays,
            delayDays,
            creditRating,
            loan.id,
          ],
        );
      }

      const durationMs = Date.now() - startTime;
      const totalProcessed = liquidatedLoans.length + activeLoans.length;

      if (executionId) {
        await this.dataSource.query(
          `UPDATE cron_executions 
           SET 
             status = 'SUCCESS',
             finished_at = NOW(),
             duration_ms = $1,
             liquidated_processed = $2,
             active_processed = $3,
             total_processed = $4
           WHERE id = $5`,
          [
            durationMs,
            liquidatedLoans.length,
            activeLoans.length,
            totalProcessed,
            executionId,
          ],
        );
      }

      this.logger.log(
        `[Cron Cierre Diario - ${triggerType}] Liquidados: ${liquidatedLoans.length}, Activos: ${activeLoans.length}, Duración: ${durationMs}ms`,
      );

      return {
        executionId: String(executionId),
        status: 'SUCCESS',
        durationMs,
        liquidatedProcessed: liquidatedLoans.length,
        activeProcessed: activeLoans.length,
        totalProcessed,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.logger.error(`Error en Cron Cierre Diario (${triggerType})`, err);

      if (executionId) {
        await this.dataSource.query(
          `UPDATE cron_executions 
           SET 
             status = 'FAILED',
             finished_at = NOW(),
             duration_ms = $1,
             error_message = $2
           WHERE id = $3`,
          [durationMs, err?.message || String(err), executionId],
        );
      }

      throw err;
    }
  }

  /**
   * Ventana 2 (01:00): Recorre todas las personas y recalcula su score en batch.
   */
  async runNightlyCreditScoreJob(): Promise<void> {
    const people = await this.dataSource.query(`SELECT id FROM people`);
    for (const person of people) {
      try {
        await this.calculateAndSavePersonScore(person.id);
      } catch (err) {
        this.logger.error(`Error calculando score para persona ID ${person.id}`, err);
      }
    }
  }

  /**
   * Consolida y actualiza en tiempo real los 5 campos analíticos en la tabla `loans`
   * para todos los préstamos de una persona (independientemente del tenant al que pertenezcan):
   * - completed_on_time
   * - early_liquidation_days
   * - extension_days
   * - delay_days
   * - credit_rating
   * - status / liquidation_date (si ya completó el 100% de la deuda)
   */
  async consolidateLoansForPerson(personId: string | number): Promise<void> {
    const pId = String(personId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Consolidar préstamos liquidados de esta persona
    const liquidatedLoans = await this.dataSource.query(
      `SELECT 
        l.id,
        l.start_date,
        l.end_date,
        l.liquidation_date,
        MAX(i.installment_date) AS last_payment_date
      FROM loans l
      LEFT JOIN loan_installments i ON i.loan_id = l.id AND i.status = 'PAID'
      LEFT JOIN company c ON c.id = l.id_company
      WHERE l.id_people = $1 
        AND l.status = 'Liquidado'
        AND (c.is_demo IS NOT TRUE)
      GROUP BY l.id, l.start_date, l.end_date, l.liquidation_date`,
      [pId],
    );

    for (const loan of liquidatedLoans) {
      const liqDate = loan.liquidation_date || loan.last_payment_date || loan.end_date;
      const indicators = calculateLoanLiquidationIndicators(
        loan.start_date,
        loan.end_date,
        liqDate,
      );

      await this.dataSource.query(
        `UPDATE loans 
         SET completed_on_time = $1,
             early_liquidation_days = $2,
             extension_days = $3,
             delay_days = $4,
             credit_rating = $5,
             liquidation_date = COALESCE(liquidation_date, $6)
         WHERE id = $7`,
        [
          indicators.completedOnTime,
          indicators.earlyLiquidationDays,
          indicators.extensionDays,
          indicators.delayDays,
          indicators.creditRating,
          liqDate,
          loan.id,
        ],
      );
    }

    // 2. Consolidar préstamos activos de esta persona
    const activeLoans = await this.dataSource.query(
      `SELECT 
        l.id,
        l.id_people,
        l.start_date,
        l.end_date,
        l.amount,
        l.interest,
        l.fee,
        COALESCE(SUM(i.amount), 0) AS total_paid,
        MAX(i.installment_date) AS last_payment_date
      FROM loans l
      LEFT JOIN loan_installments i ON i.loan_id = l.id AND i.status = 'PAID'
      LEFT JOIN company c ON c.id = l.id_company
      WHERE l.id_people = $1 
        AND l.status = 'Activo'
        AND (c.is_demo IS NOT TRUE)
      GROUP BY l.id, l.id_people, l.start_date, l.end_date, l.amount, l.interest, l.fee`,
      [pId],
    );

    for (const loan of activeLoans) {
      const totalLoan = Number(loan.amount) + Number(loan.interest);
      const totalPaid = Number(loan.total_paid) || 0;

      // 2.1 Si ya pagó la totalidad, liquidar formalmente
      if (totalPaid >= totalLoan) {
        const liqDate = loan.last_payment_date || today;
        const indicators = calculateLoanLiquidationIndicators(
          loan.start_date,
          loan.end_date,
          liqDate,
        );

        await this.dataSource.query(
          `UPDATE loans 
           SET status = 'Liquidado',
               liquidation_date = $1,
               completed_on_time = $2,
               early_liquidation_days = $3,
               extension_days = $4,
               delay_days = $5,
               credit_rating = $6
           WHERE id = $7`,
          [
            liqDate,
            indicators.completedOnTime,
            indicators.earlyLiquidationDays,
            indicators.extensionDays,
            indicators.delayDays,
            indicators.creditRating,
            loan.id,
          ],
        );
        continue;
      }

      // 2.2 Préstamo continúa activo con saldo pendiente
      const contractEndDate = new Date(loan.end_date);
      contractEndDate.setHours(0, 0, 0, 0);

      const isOverdueContract = contractEndDate < today;
      const extensionDays = isOverdueContract ? countWorkdaysBetween(loan.end_date, today) : 0;
      const completedOnTime = false;
      const earlyLiquidationDays = 0;

      const fee = Number(loan.fee) || 1;
      const remainingAmount = Math.max(0, totalLoan - totalPaid);
      const remainingInstallments = Math.ceil(remainingAmount / fee);

      let delayDays = 0;
      if (isOverdueContract) {
        // Fuera de plazo contractual: el retraso en cuotas es exactamente el saldo de cuotas impagas
        delayDays = remainingInstallments;
      } else {
        // En curso: evaluar cuotas exigibles a la fecha menos lo amortizado
        const workdaysDue = countWorkdaysDue(loan.start_date, today);
        const paidInstallments = totalPaid / fee;
        delayDays = Math.max(0, Math.min(remainingInstallments, Math.floor(workdaysDue - paidInstallments)));
      }

      let creditRating: 'A' | 'B' | 'C' = 'A';
      if (delayDays > 3 || extensionDays > 3) {
        creditRating = 'C';
      } else if (delayDays > 0 || extensionDays > 0) {
        creditRating = 'B';
      }

      await this.dataSource.query(
        `UPDATE loans 
         SET completed_on_time = $1,
             early_liquidation_days = $2,
             extension_days = $3,
             delay_days = $4,
             credit_rating = $5
         WHERE id = $6`,
        [
          completedOnTime,
          earlyLiquidationDays,
          extensionDays,
          delayDays,
          creditRating,
          loan.id,
        ],
      );
    }
  }

  /**
   * Evalúa y recalcula a demanda (On-Demand) el score y los 3 pilares de una persona en < 15 ms.
   * Utilizable tanto por el cron nocturno como por endpoints y eventos post-liquidación.
   */
  async calculateAndSavePersonScore(personId: string | number): Promise<{ creditScore: number; creditScoreDetail: ScoreDetailPayload }> {
    const pId = String(personId);

    // 0. Consolidar primero en tiempo real los préstamos de esta persona en la tabla `loans`
    await this.consolidateLoansForPerson(pId);

    // 1. Obtener todos los préstamos del prestatario en todos los tenants (frescos y consolidados, excluyendo empresas demo)
    const loans = await this.dataSource.query(
      `SELECT 
        l.id,
        l.id_company,
        l.status,
        l.amount,
        l.interest,
        l.fee,
        l.start_date,
        l.end_date,
        l.liquidation_date,
        l.completed_on_time,
        l.early_liquidation_days,
        l.extension_days,
        l.delay_days,
        l.credit_rating,
        COALESCE(SUM(i.amount), 0) AS total_paid
      FROM loans l
      LEFT JOIN loan_installments i ON i.loan_id = l.id AND i.status = 'PAID'
      LEFT JOIN company c ON c.id = l.id_company
      WHERE l.id_people = $1 
        AND l.status != 'Eliminado'
        AND (c.is_demo IS NOT TRUE)
      GROUP BY l.id, l.id_company, l.status, l.amount, l.interest, l.fee, l.start_date, l.end_date, l.liquidation_date, l.completed_on_time, l.early_liquidation_days, l.extension_days, l.delay_days, l.credit_rating`,
      [pId],
    );

    const liquidatedLoans = loans.filter((l: any) => l.status === 'Liquidado');
    const activeLoans = loans.filter((l: any) => l.status === 'Activo');

    // Métricas Agregadas
    const totalLoansCount = loans.length;
    const liquidatedCount = liquidatedLoans.length;
    const activeCount = activeLoans.length;

    const activeTenantsSet = new Set(activeLoans.map((l: any) => l.id_company).filter(Boolean));
    const activeTenantsCount = activeTenantsSet.size;

    let totalDebtAmount = 0;
    let totalPaidAmount = 0;
    loans.forEach((l: any) => {
      const paid = Number(l.total_paid) || 0;
      totalPaidAmount += paid;
      if (l.status === 'Activo') {
        const totalLoan = Number(l.amount) + Number(l.interest);
        totalDebtAmount += Math.max(0, totalLoan - paid);
      }
    });

    // ----------------------------------------------------
    // PILAR 1: Reputación Histórica (0 a 40 puntos)
    // ----------------------------------------------------
    let p1Score = 0;
    let liquidatedOnTimeCount = 0;
    let earlyLiquidatedCount = 0;
    let liquidatedWithExtensionCount = 0;
    let isNewCustomer = false;
    let avgDelayDays = 0;
    let p1Assessment = '';

    if (liquidatedLoans.length === 0) {
      isNewCustomer = true;
      p1Score = 25; // Base neutral de confianza para cliente nuevo
      p1Assessment = 'Cliente nuevo sin historial previo de préstamos liquidados.';
    } else {
      let accumulatedPoints = 0;
      let totalDelays = 0;

      for (const l of liquidatedLoans) {
        const delays = Number(l.delay_days) || 0;
        const extension = Number(l.extension_days) || 0;
        const early = Number(l.early_liquidation_days) || 0;
        totalDelays += delays;

        if (l.completed_on_time) {
          liquidatedOnTimeCount++;
          if (early > 0) {
            earlyLiquidatedCount++;
            accumulatedPoints += 10;
          } else {
            accumulatedPoints += 8;
          }
        } else {
          liquidatedWithExtensionCount++;
          if (extension <= 3) {
            accumulatedPoints += 6;
          } else if (extension <= 10) {
            accumulatedPoints += 3;
          }
        }
      }

      avgDelayDays = Number((totalDelays / liquidatedLoans.length).toFixed(1));
      p1Score = Math.min(40, accumulatedPoints);

      if (p1Score >= 35) {
        p1Assessment = 'Historial impecable con pagos oportunos o cancelaciones anticipadas.';
      } else if (p1Score >= 20) {
        p1Assessment = 'Historial positivo con cancelaciones totales (algunas con prórroga leve).';
      } else {
        p1Assessment = 'Historial con reiteradas prórrogas fuera de fecha contractual.';
      }
    }

    // ----------------------------------------------------
    // PILAR 2: Puntualidad en Préstamos Activos (0 a 45 puntos)
    // ----------------------------------------------------
    let p2Score = 45;
    let maxActiveDelayDays = 0;
    let unpaidInstallmentsCount = 0;
    let p2Status: 'AL_DIA' | 'MORA_LEVE' | 'MORA_MODERADA' | 'MORA_GRAVE' | 'MORA_CRITICA' = 'AL_DIA';
    let p2Assessment = '';

    if (activeLoans.length > 0) {
      const today = new Date();
      for (const l of activeLoans) {
        const workdaysDue = countWorkdaysDue(l.start_date, today);
        const fee = Number(l.fee) || 1;
        const totalPaid = Number(l.total_paid) || 0;
        const paidInstallments = totalPaid / fee;
        const delay = Math.max(0, Math.floor(workdaysDue - paidInstallments));

        if (delay > maxActiveDelayDays) {
          maxActiveDelayDays = delay;
        }
        if (delay > 0) {
          unpaidInstallmentsCount += delay;
        }
      }

      if (maxActiveDelayDays === 0) {
        p2Score = 45;
        p2Status = 'AL_DIA';
        p2Assessment = '100% puntual en todas las cuotas exigibles a la fecha.';
      } else if (maxActiveDelayDays <= 2) {
        p2Score = 35;
        p2Status = 'MORA_LEVE';
        p2Assessment = `Atraso leve de ${maxActiveDelayDays} cuotas pendientes.`;
      } else if (maxActiveDelayDays <= 5) {
        p2Score = 20;
        p2Status = 'MORA_MODERADA';
        p2Assessment = `Atraso moderado de ${maxActiveDelayDays} cuotas pendientes.`;
      } else if (maxActiveDelayDays <= 12) {
        p2Score = 10;
        p2Status = 'MORA_GRAVE';
        p2Assessment = `Atraso severo de ${maxActiveDelayDays} cuotas sin abonar.`;
      } else {
        p2Score = 0;
        p2Status = 'MORA_CRITICA';
        p2Assessment = `Mora crítica superior a ${maxActiveDelayDays} cuotas impagas.`;
      }
    } else {
      p2Score = 45;
      p2Status = 'AL_DIA';
      if (totalLoansCount === 0) {
        p2Assessment = 'Sin préstamos activos en curso (no registra deudas pendientes).';
      } else {
        p2Assessment = 'Sin compromisos activos actualmente; créditos previos 100% cancelados.';
      }
    }

    // ----------------------------------------------------
    // PILAR 3: Capacidad de Endeudamiento y Mora Cruzada Multi-Tenant (0 a 15 puntos)
    // ----------------------------------------------------
    let p3Score = 15;
    let hasCrossTenantArrears = false;
    let p3Status: 'OPTIMO' | 'MODERADO' | 'SOBRE_ENDEUDADO' | 'ALERTA_CRUZADA' = 'OPTIMO';
    let p3Assessment = '';

    if (activeLoans.length > 0) {
      // Verificación de mora cruzada: si tiene créditos en >1 tenant y alguno tiene mora
      if (activeTenantsCount > 1 && maxActiveDelayDays > 0) {
        hasCrossTenantArrears = true;
        p3Score = 0;
        p3Status = 'ALERTA_CRUZADA';
        p3Assessment = 'Alerta de riesgo: mantiene atrasos en una empresa mientras opera en otra.';
      } else if (activeLoans.length === 1) {
        p3Score = 15;
        p3Status = 'OPTIMO';
        p3Assessment = 'Un solo crédito activo en curso; volumen de deuda ideal.';
      } else if (activeLoans.length === 2) {
        p3Score = 12;
        p3Status = 'MODERADO';
        p3Assessment = 'Dos créditos activos simultáneos al día.';
      } else {
        p3Score = 8;
        p3Status = 'SOBRE_ENDEUDADO';
        p3Assessment = 'Tres o más créditos activos concurrentes (alta exposición).';
      }
    } else {
      p3Score = 15;
      p3Status = 'OPTIMO';
      if (totalLoansCount === 0) {
        p3Assessment = 'Capacidad crediticia 100% disponible (sin endeudamiento previo).';
      } else {
        p3Assessment = 'Línea de crédito 100% disponible; sin operaciones simultáneas activas.';
      }
    }

    // ----------------------------------------------------
    // CONSOLIDACIÓN DEL SCORE GLOBAL (0 - 100)
    // ----------------------------------------------------
    const finalScore = Math.min(100, Math.max(0, p1Score + p2Score + p3Score));

    let rating: 'A+' | 'A' | 'B' | 'C' = 'A';
    let ratingLabel = 'Bueno / Riesgo Bajo';
    let recStatus: 'APROBADO' | 'SUJETO_A_CONDICIONES' | 'BLOQUEADO' = 'APROBADO';
    let recAction = totalLoansCount === 0
      ? 'Cliente nuevo sin historial: apto para primer crédito con monto inicial estándar.'
      : 'Apto para crédito estándar.';
    let riskLevel: 'MINIMO' | 'BAJO' | 'MEDIO' | 'ALTO' = 'BAJO';

    if (finalScore >= 90) {
      rating = 'A+';
      ratingLabel = 'Excelente / Riesgo Mínimo';
      recStatus = 'APROBADO';
      recAction = 'Cliente preferente estrella: apto para tasas preferenciales y ampliación de límite.';
      riskLevel = 'MINIMO';
    } else if (finalScore >= 75) {
      rating = 'A';
      ratingLabel = 'Bueno / Riesgo Bajo';
      recStatus = 'APROBADO';
      recAction = 'Cliente cumplidor habitual: créditos regulares aprobados.';
      riskLevel = 'BAJO';
    } else if (finalScore >= 50) {
      rating = 'B';
      ratingLabel = 'Regular / Riesgo Medio';
      recStatus = 'SUJETO_A_CONDICIONES';
      recAction = 'Requiere seguimiento diario y montos controlados.';
      riskLevel = 'MEDIO';
    } else {
      rating = 'C';
      ratingLabel = 'Crítico / Alto Riesgo';
      recStatus = 'BLOQUEADO';
      recAction = 'Riesgo alto de impago o mora activa severa: bloquear nuevos desembolsos.';
      riskLevel = 'ALTO';
    }

    const detailPayload: ScoreDetailPayload = {
      calculated_at: new Date().toISOString(),
      score: finalScore,
      rating,
      rating_label: ratingLabel,
      summary: {
        total_loans_count: totalLoansCount,
        liquidated_count: liquidatedCount,
        active_count: activeCount,
        active_tenants_count: activeTenantsCount,
        has_arrears: maxActiveDelayDays > 0,
        total_debt_amount: Number(totalDebtAmount.toFixed(2)),
        total_paid_amount: Number(totalPaidAmount.toFixed(2)),
      },
      pillars: {
        reputation_history: {
          score: p1Score,
          max_score: 40,
          weight_percent: 40,
          liquidated_on_time_count: liquidatedOnTimeCount,
          early_liquidated_count: earlyLiquidatedCount,
          liquidated_with_extension_count: liquidatedWithExtensionCount,
          avg_delay_days: avgDelayDays,
          is_new_customer: isNewCustomer,
          assessment: p1Assessment,
        },
        active_punctuality: {
          score: p2Score,
          max_score: 45,
          weight_percent: 45,
          active_delay_days: maxActiveDelayDays,
          unpaid_installments_count: unpaidInstallmentsCount,
          status: p2Status,
          assessment: p2Assessment,
        },
        debt_capacity: {
          score: p3Score,
          max_score: 15,
          weight_percent: 15,
          active_loans_count: activeCount,
          active_tenants_count: activeTenantsCount,
          has_cross_tenant_arrears: hasCrossTenantArrears,
          status: p3Status,
          assessment: p3Assessment,
        },
      },
      recommendations: {
        status: recStatus,
        suggested_action: recAction,
        risk_level: riskLevel,
      },
    };

    // Actualización atómica e idempotente en PostgreSQL
    await this.dataSource.query(
      `UPDATE people 
       SET credit_score = $1, credit_score_detail = $2::jsonb 
       WHERE id = $3`,
      [finalScore, JSON.stringify(detailPayload), pId],
    );

    return {
      creditScore: finalScore,
      creditScoreDetail: detailPayload,
    };
  }

  /**
   * Ventana 3 (02:00 AM) o a demanda: Limpieza y purga periódica de la empresa DEMO (ID 102).
   * Elimina cuotas (loan_installments), préstamos (loans) y gastos (expenses)
   * que tengan más de 4 días de antigüedad para mantener la demo liviana y sin saturación.
   */
  async runDemoCompanyCleanupJob(
    triggerType: 'SCHEDULED' | 'MANUAL' = 'SCHEDULED',
    targetCompanyId: number = 102,
    daysThreshold: number = 4,
  ): Promise<{
    executionId: string;
    status: string;
    durationMs: number;
    loansDeleted: number;
    installmentsDeleted: number;
    expensesDeleted: number;
    totalProcessed: number;
  }> {
    await this.ensureCronTableExists();
    const startTime = Date.now();

    const insertRes = await this.dataSource.query(
      `INSERT INTO cron_executions (job_name, trigger_type, status, started_at) 
       VALUES ($1, $2, 'RUNNING', NOW()) 
       RETURNING id`,
      ['DEMO_COMPANY_CLEANUP', triggerType],
    );
    const executionId = insertRes[0]?.id;

    try {
      this.logger.log(
        `Ejecutando purga demo para Empresa ${targetCompanyId} (registros > ${daysThreshold} días)...`,
      );

      // 1. Obtener IDs de préstamos antiguos de la empresa demo
      const loansToPurge = await this.dataSource.query(
        `SELECT id FROM loans 
         WHERE id_company = $1 
           AND (created_at < (CURRENT_DATE - ($2 || ' days')::INTERVAL)
                OR start_date < (CURRENT_DATE - ($2 || ' days')::INTERVAL))`,
        [targetCompanyId, daysThreshold],
      );

      let installmentsDeleted = 0;
      let loansDeleted = 0;

      if (loansToPurge.length > 0) {
        const loanIds = loansToPurge.map((r: any) => r.id);

        // 2. Borrar cuotas de dichos préstamos
        const deleteInstallmentsRes = await this.dataSource.query(
          `DELETE FROM loan_installments 
           WHERE loan_id = ANY($1::bigint[])`,
          [loanIds],
        );
        installmentsDeleted = deleteInstallmentsRes[1] || 0;

        // 3. Borrar los préstamos
        const deleteLoansRes = await this.dataSource.query(
          `DELETE FROM loans 
           WHERE id = ANY($1::bigint[])`,
          [loanIds],
        );
        loansDeleted = deleteLoansRes[1] || 0;
      }

      // 4. Borrar gastos de la empresa demo con antigüedad > daysThreshold días
      const deleteExpensesRes = await this.dataSource.query(
        `DELETE FROM expenses 
         WHERE expense_date < (CURRENT_TIMESTAMP - ($2 || ' days')::INTERVAL)
           AND id_company = $1`,
        [targetCompanyId, daysThreshold],
      );
      const expensesDeleted = deleteExpensesRes[1] || 0;

      const durationMs = Date.now() - startTime;
      const totalProcessed = loansDeleted + expensesDeleted;

      const detailsJson = JSON.stringify({
        companyId: targetCompanyId,
        daysThreshold,
        loansDeleted,
        installmentsDeleted,
        expensesDeleted,
      });

      if (executionId) {
        await this.dataSource.query(
          `UPDATE cron_executions 
           SET 
             status = 'SUCCESS',
             finished_at = NOW(),
             duration_ms = $1,
             liquidated_processed = $2,
             active_processed = $3,
             total_processed = $4,
             details = $5::jsonb
           WHERE id = $6`,
          [
            durationMs,
            loansDeleted,
            expensesDeleted,
            totalProcessed,
            detailsJson,
            executionId,
          ],
        );
      }

      this.logger.log(
        `Purga demo finalizada: ${loansDeleted} préstamos, ${installmentsDeleted} abonos, ${expensesDeleted} gastos eliminados (${durationMs}ms)`,
      );

      return {
        executionId,
        status: 'SUCCESS',
        durationMs,
        loansDeleted,
        installmentsDeleted,
        expensesDeleted,
        totalProcessed,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      this.logger.error('Error al ejecutar purga demo:', error);

      if (executionId) {
        await this.dataSource.query(
          `UPDATE cron_executions 
           SET 
             status = 'FAILED',
             finished_at = NOW(),
             duration_ms = $1,
             error_message = $2
           WHERE id = $3`,
          [durationMs, error?.message || 'Error desconocido', executionId],
        );
      }

      throw error;
    }
  }
}

