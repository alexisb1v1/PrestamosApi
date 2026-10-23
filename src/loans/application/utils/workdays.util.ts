/**
 * Utilidades para cálculo de días hábiles laborables (excluyendo domingos)
 * e indicadores de liquidación de préstamos para NeoCobros.
 */

/**
 * Normaliza una fecha a medianoche (00:00:00.000) en tiempo local
 */
export function normalizeDate(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Cuenta los días hábiles laborables (lunes a sábado, excluyendo domingos)
 * estrictamente posteriores a `startDate` y hasta `endDate` inclusive.
 * Ejemplo: Del 13/10 al 19/10 evalúa [14, 15, 16, 17, 18, 19] = 6 días si ninguno es domingo.
 */
export function countWorkdaysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (start >= end) {
    return 0;
  }

  let workdays = 0;
  const current = new Date(start);
  current.setDate(current.getDate() + 1);

  while (current <= end) {
    if (current.getDay() !== 0) {
      // 0 = Domingo
      workdays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workdays;
}

/**
 * Calcula los días hábiles transcurridos desde startDate hasta today inclusive (excluyendo domingos).
 */
export function countWorkdaysDue(startDate: Date | string, asOfDate: Date | string = new Date()): number {
  const start = normalizeDate(startDate);
  const asOf = normalizeDate(asOfDate);

  if (start > asOf) {
    return 0;
  }

  let workdays = 0;
  const current = new Date(start);

  while (current <= asOf) {
    if (current.getDay() !== 0) {
      workdays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workdays;
}

export interface LiquidationIndicators {
  completedOnTime: boolean;
  earlyLiquidationDays: number;
  extensionDays: number;
  delayDays: number;
  creditRating: 'A+' | 'A' | 'B' | 'C';
}

/**
 * Calcula los indicadores de liquidación cuando un préstamo llega a saldo <= 0.
 * Regla de Oro: En préstamos liquidados, los retrasos solo se evalúan desde la fecha de liquidación hacia atrás.
 */
export function calculateLoanLiquidationIndicators(
  startDate: Date | string,
  endDate: Date | string,
  liquidationDate: Date | string = new Date(),
): LiquidationIndicators {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const liq = normalizeDate(liquidationDate);

  if (liq <= end) {
    // Liquidó en fecha o anticipadamente
    const earlyLiquidationDays = liq < end ? countWorkdaysBetween(liq, end) : 0;
    const extensionDays = 0;
    const completedOnTime = true;
    const delayDays = 0;
    const creditRating: 'A+' | 'A' = earlyLiquidationDays > 0 ? 'A+' : 'A';

    return {
      completedOnTime,
      earlyLiquidationDays,
      extensionDays,
      delayDays,
      creditRating,
    };
  } else {
    // Liquidó fuera de plazo (con prórroga)
    const earlyLiquidationDays = 0;
    const extensionDays = countWorkdaysBetween(end, liq);
    const completedOnTime = false;
    const delayDays = extensionDays;
    const creditRating: 'B' | 'C' = extensionDays <= 3 ? 'B' : 'C';

    return {
      completedOnTime,
      earlyLiquidationDays,
      extensionDays,
      delayDays,
      creditRating,
    };
  }
}
