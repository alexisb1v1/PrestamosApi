import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetConsolidatedReportQuery } from '../get-consolidated-report.query';
import { GetCollectorReportQuery } from '../get-collector-report.query';
import { GetClientHealthReportQuery } from '../get-client-health-report.query';
import { GetCapitalInvestmentReportQuery } from '../get-capital-investment-report.query';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

@QueryHandler(GetConsolidatedReportQuery)
export class GetConsolidatedReportHandler implements IQueryHandler<GetConsolidatedReportQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetConsolidatedReportQuery) {
    const { startDate, endDate, companyId } = query;
    let queryStr = `
      SELECT 
        COALESCE(SUM(p.amount), 0) as total_collected,
        COALESCE(SUM(CASE WHEN UPPER(p.payment_type) = 'EFECTIVO' THEN p.amount ELSE 0 END), 0) as cash_collected,
        COALESCE(SUM(CASE WHEN UPPER(p.payment_type) != 'EFECTIVO' THEN p.amount ELSE 0 END), 0) as digital_collected,
        COALESCE(SUM(p.amount * (l.amount / NULLIF(l.amount + l.interest, 0))), 0) as total_capital_recovered,
        COALESCE(SUM(p.amount * (l.interest / NULLIF(l.amount + l.interest, 0))), 0) as total_interest_earned
      FROM loan_installments p
      JOIN loans l ON p.loan_id = l.id
      WHERE p.installment_date BETWEEN $1 AND $2
    `;
    const params: any[] = [startDate, endDate];
    if (companyId) {
      queryStr += ` AND l.id_company = $3`;
      params.push(companyId);
    }
    
    let expensesQuery = `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE expense_date BETWEEN $1 AND $2 AND status != 'ELIMINADO'`;
    const expParams: any[] = [startDate, endDate];
    if (companyId) {
      expensesQuery += ` AND id_company = $3`;
      expParams.push(companyId);
    }

    let dailyQueryStr = `
      SELECT 
        to_char(p.installment_date, 'YYYY-MM-DD') as date,
        COALESCE(SUM(p.amount), 0) as amount
      FROM loan_installments p
      JOIN loans l ON p.loan_id = l.id
      WHERE p.installment_date BETWEEN $1 AND $2
    `;
    if (companyId) {
      dailyQueryStr += ` AND l.id_company = $3`;
    }
    dailyQueryStr += ` GROUP BY to_char(p.installment_date, 'YYYY-MM-DD') ORDER BY date ASC`;

    let expectedGlobalQuery = `
      SELECT COALESCE(SUM(l.fee), 0) as expected_amount
      FROM loans l
      CROSS JOIN generate_series($1::date, $2::date, '1 day'::interval) as d(day)
      WHERE d.day >= l.start_date
        AND d.day <= COALESCE(l.liquidation_date, CURRENT_DATE)
        AND EXTRACT(DOW FROM d.day) != 0
        AND l.status != 'Eliminado'
    `;
    if (companyId) {
      expectedGlobalQuery += ` AND l.id_company = $3`;
    }

    const [collections] = await this.dataSource.query(queryStr, params);
    const [expenses] = await this.dataSource.query(expensesQuery, expParams);
    const dailyCollectionsRaw = await this.dataSource.query(dailyQueryStr, params);
    const [expectedGlobal] = await this.dataSource.query(expectedGlobalQuery, params);

    return {
      totalCollected: Number(collections.total_collected || 0),
      cashCollected: Number(collections.cash_collected || 0),
      digitalCollected: Number(collections.digital_collected || 0),
      capitalRecovered: Number(collections.total_capital_recovered || 0),
      interestEarned: Number(collections.total_interest_earned || 0),
      totalExpenses: Number(expenses.total_expenses || 0),
      expectedAmount: Number(expectedGlobal?.expected_amount || 0),
      netBalance: Number(collections.total_collected || 0) - Number(expenses.total_expenses || 0),
      dailyCollections: dailyCollectionsRaw.map((d: any) => ({
        date: d.date,
        amount: Number(d.amount)
      }))
    };
  }
}

@QueryHandler(GetCollectorReportQuery)
export class GetCollectorReportHandler implements IQueryHandler<GetCollectorReportQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetCollectorReportQuery) {
    const { startDate, endDate, companyId, userId } = query;
    let queryStr = `
      SELECT 
        u.id as user_id,
        pe.id as person_id,
        pe.first_name,
        pe.last_name,
        pe.document_number,
        COUNT(DISTINCT l.id_people) as clients_count,
        COUNT(DISTINCT p.loan_id) as active_loans_count,
        COUNT(p.id) as payment_count,
        COALESCE(SUM(p.amount), 0) as total_collected,
        COALESCE(SUM(CASE WHEN UPPER(p.payment_type) = 'EFECTIVO' THEN p.amount ELSE 0 END), 0) as cash_collected,
        COALESCE(SUM(CASE WHEN UPPER(p.payment_type) != 'EFECTIVO' THEN p.amount ELSE 0 END), 0) as digital_collected,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses e WHERE e.user_id = u.id AND e.status != 'ELIMINADO' AND e.expense_date BETWEEN $1 AND $2 ${companyId ? 'AND e.id_company = $3' : ''}) as gastos_ruta
      FROM loan_installments p
      JOIN "user" u ON p.user_id = u.id
      JOIN people pe ON u.id_people = pe.id
      JOIN loans l ON p.loan_id = l.id
      WHERE p.installment_date BETWEEN $1 AND $2
    `;
    const params: any[] = [startDate, endDate];
    let paramIdx = 3;

    if (companyId) {
      queryStr += ` AND l.id_company = $3`;
      params.push(companyId);
      paramIdx++;
    }

    if (userId) {
      queryStr += ` AND u.id = $${paramIdx}`;
      params.push(userId);
    }

    queryStr += ` GROUP BY u.id, pe.id, pe.first_name, pe.last_name, pe.document_number`;

    const rawData = await this.dataSource.query(queryStr, params);

    const result: any[] = [];
    for (const r of rawData) {
      const uid = r.user_id;
      
      let dailyCollections: any[] = [];
      let recentPayments: any[] = [];
      let expectedAmount = 0;

      if (userId) { // Solo si pidieron el detalle de un cobrador especifico
        // 1. Recaudo Diario
        const dailyQueryStr = `
          SELECT 
            to_char(p.installment_date, 'YYYY-MM-DD') as date,
            COALESCE(SUM(p.amount), 0) as amount
          FROM loan_installments p
          JOIN "user" u ON p.user_id = u.id
          WHERE p.installment_date BETWEEN $1 AND $2 AND u.id = $3
          GROUP BY to_char(p.installment_date, 'YYYY-MM-DD') ORDER BY date ASC
        `;
        const dailyRaw = await this.dataSource.query(dailyQueryStr, [startDate, endDate, uid]);

        const dailyExpQueryStr = `
          SELECT 
            to_char(expense_date, 'YYYY-MM-DD') as date,
            COALESCE(SUM(amount), 0) as amount
          FROM expenses
          WHERE expense_date BETWEEN $1 AND $2 AND user_id = $3 AND status != 'ELIMINADO'
          GROUP BY to_char(expense_date, 'YYYY-MM-DD')
        `;
        const dailyExpRaw = await this.dataSource.query(dailyExpQueryStr, [startDate, endDate, uid]);
        
        const dailyExpectedStr = `
          SELECT 
            to_char(d.day, 'YYYY-MM-DD') as date,
            SUM(l.fee) as amount
          FROM loans l
          CROSS JOIN generate_series($1::date, $2::date, '1 day'::interval) as d(day)
          WHERE l.user_id = $3
            AND d.day >= l.start_date
            AND d.day <= COALESCE(l.liquidation_date, CURRENT_DATE)
            AND EXTRACT(DOW FROM d.day) != 0
            AND l.status != 'Eliminado'
          GROUP BY d.day
        `;
        const dailyExpectedRaw = await this.dataSource.query(dailyExpectedStr, [startDate, endDate, uid]);
        
        const allDates = new Set([
          ...dailyRaw.map((d: any) => d.date), 
          ...dailyExpRaw.map((e: any) => e.date),
          ...dailyExpectedRaw.map((e: any) => e.date)
        ]);
        
        dailyCollections = Array.from(allDates).sort().map(date => ({
          date,
          amount: Number(dailyRaw.find((d: any) => d.date === date)?.amount || 0),
          expense: Number(dailyExpRaw.find((e: any) => e.date === date)?.amount || 0),
          expectedAmount: Number(dailyExpectedRaw.find((e: any) => e.date === date)?.amount || 0)
        }));

        // 2. Cobros Detallados Recientes (Para la tabla)
        const recentPaymentsStr = `
          SELECT 
            p.id,
            p.amount,
            p.installment_date as date,
            p.payment_type as method,
            c.first_name as client_name,
            c.last_name as client_last_name
          FROM loan_installments p
          JOIN loans l ON p.loan_id = l.id
          JOIN people c ON l.id_people = c.id
          JOIN "user" u ON p.user_id = u.id
          WHERE p.installment_date BETWEEN $1 AND $2 AND u.id = $3
          ORDER BY p.installment_date DESC, p.id DESC
        `;
        const paymentsRaw = await this.dataSource.query(recentPaymentsStr, [startDate, endDate, uid]);
        const mappedPayments = paymentsRaw.map((p: any) => ({
          id: `pay_${p.id}`,
          amount: Number(p.amount),
          date: p.date,
          method: p.method,
          client: `${p.client_name} ${p.client_last_name}`,
          type: 'PAYMENT'
        }));

        const recentExpensesStr = `
          SELECT 
            e.id,
            e.amount,
            e.expense_date as date,
            e.descripcion as desc
          FROM expenses e
          WHERE e.expense_date BETWEEN $1 AND $2 AND e.user_id = $3 AND e.status != 'ELIMINADO'
        `;
        const expensesRaw = await this.dataSource.query(recentExpensesStr, [startDate, endDate, uid]);
        const mappedExpenses = expensesRaw.map((e: any) => ({
          id: `exp_${e.id}`,
          amount: Number(e.amount),
          date: e.date,
          method: 'EFECTIVO', // Gastos usualmente son en efectivo, o ponemos 'GASTO'
          client: e.desc || 'Gasto Operativo',
          type: 'EXPENSE'
        }));

        recentPayments = [...mappedPayments, ...mappedExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 3. Calculo de Recaudo Esperado (Aproximación basada en los préstamos vivos que este usuario administra excluyendo domingos)
        const expectedStr = `
          SELECT SUM(l.fee) as expected_amount
          FROM loans l
          CROSS JOIN generate_series($1::date, $2::date, '1 day'::interval) as d(day)
          WHERE l.user_id = $3
            AND d.day >= l.start_date
            AND d.day <= COALESCE(l.liquidation_date, CURRENT_DATE)
            AND EXTRACT(DOW FROM d.day) != 0
            AND l.status != 'Eliminado'
        `;
        const [expectedRaw] = await this.dataSource.query(expectedStr, [startDate, endDate, uid]);
        expectedAmount = Number(expectedRaw?.expected_amount || 0);
      }

      result.push({
        userId: r.user_id,
        name: `${r.first_name} ${r.last_name}`,
        documentNumber: r.document_number,
        clientes: Number(r.clients_count),
        prestamosActivos: Number(r.active_loans_count),
        paymentCount: Number(r.payment_count),
        totalCollected: Number(r.total_collected),
        cashCollected: Number(r.cash_collected),
        digitalCollected: Number(r.digital_collected),
        gastosRuta: Number(r.gastos_ruta),
        netoEntregar: Number(r.total_collected) - Number(r.gastos_ruta),
        dailyCollections,
        recentPayments,
        expectedAmount
      });
    }

    return result;
  }
}

@QueryHandler(GetClientHealthReportQuery)
export class GetClientHealthReportHandler implements IQueryHandler<GetClientHealthReportQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetClientHealthReportQuery) {
    const [person] = await this.dataSource.query(`SELECT * FROM people WHERE id = $1`, [query.personId]);
    if (!person) return null;

    const loans = await this.dataSource.query(`
      SELECT 
        l.id, l.amount, l.interest, l.fee, l.status, l.start_date, l.created_at,
        (SELECT COALESCE(SUM(amount), 0) FROM loan_installments p WHERE p.loan_id = l.id) as total_paid
      FROM loans l
      LEFT JOIN company c ON c.id = l.id_company
      WHERE l.id_people = $1
        AND (c.is_demo IS NOT TRUE)
      ORDER BY l.created_at DESC
    `, [query.personId]);

    const score = Number(person.credit_score || 100);
    let state = 'VERDE';
    if (score < 85 && score >= 65) state = 'AMARILLO';
    else if (score < 65 && score >= 40) state = 'NARANJA';
    else if (score < 40) state = 'ROJO';

    return {
      person: {
        id: person.id,
        documentNumber: person.document_number,
        fullName: `${person.first_name} ${person.last_name}`,
        creditScore: score,
        suggestedLimit: person.suggested_limit ? Number(person.suggested_limit) : null,
        healthState: state,
      },
      history: loans.map(l => ({
        loanId: l.id,
        amount: Number(l.amount),
        interest: Number(l.interest),
        fee: Number(l.fee),
        status: l.status,
        startDate: l.start_date,
        totalPaid: Number(l.total_paid),
        progressPercentage: Math.min(100, Math.round((Number(l.total_paid) / (Number(l.amount) + Number(l.interest))) * 100))
      }))
    };
  }
}

const MONTH_NAMES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'
];

@QueryHandler(GetCapitalInvestmentReportQuery)
export class GetCapitalInvestmentReportHandler implements IQueryHandler<GetCapitalInvestmentReportQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(query: GetCapitalInvestmentReportQuery) {
    const { months = 12, companyId } = query;

    // 1. Resumen de Cartera Activa (Capital e Interés en Calle actual)
    let activeQuery = `
      SELECT 
        COUNT(l.id) as active_loans_count,
        COALESCE(SUM(l.amount), 0) as total_active_principal,
        COALESCE(SUM(l.amount + l.interest), 0) as total_active_original_debt,
        COALESCE(SUM(paid.total_paid), 0) as total_active_paid,
        COALESCE(SUM(paid.paid_principal), 0) as total_active_recovered
      FROM loans l
      LEFT JOIN (
        SELECT 
          p.loan_id,
          SUM(p.amount) as total_paid,
          SUM(p.amount * (lx.amount / NULLIF(lx.amount + lx.interest, 0))) as paid_principal
        FROM loan_installments p
        JOIN loans lx ON p.loan_id = lx.id
        GROUP BY p.loan_id
      ) paid ON paid.loan_id = l.id
      WHERE l.status = 'Activo' AND l.status != 'Eliminado'
    `;
    const activeParams: any[] = [];
    if (companyId) {
      activeQuery += ` AND l.id_company = $1`;
      activeParams.push(companyId);
    }

    const [activeStats] = await this.dataSource.query(activeQuery, activeParams);
    const activeLoansCount = Number(activeStats?.active_loans_count || 0);
    const activeOriginalPrincipal = Number(activeStats?.total_active_principal || 0);
    const activeOriginalDebt = Number(activeStats?.total_active_original_debt || 0);
    const activeTotalPaid = Number(activeStats?.total_active_paid || 0);
    const activeRecovered = Number(activeStats?.total_active_recovered || 0);

    const activeTotalRemaining = Math.max(0, activeOriginalDebt - activeTotalPaid);
    const activeCapitalInStreet = Math.max(0, activeOriginalPrincipal - activeRecovered);
    const activeInterestRemaining = Math.max(0, activeTotalRemaining - activeCapitalInStreet);

    // 2. Resumen Histórico Acumulado
    let histLentQuery = `SELECT COALESCE(SUM(amount), 0) as historical_lent FROM loans WHERE status != 'Eliminado'`;
    let histPayQuery = `
      SELECT 
        COALESCE(SUM(p.amount * (l.amount / NULLIF(l.amount + l.interest, 0))), 0) as historical_recovered,
        COALESCE(SUM(p.amount * (l.interest / NULLIF(l.amount + l.interest, 0))), 0) as historical_interest
      FROM loan_installments p
      JOIN loans l ON p.loan_id = l.id
      WHERE l.status != 'Eliminado'
    `;
    let histExpQuery = `SELECT COALESCE(SUM(e.amount), 0) as historical_expenses FROM expenses e WHERE e.status != 'ELIMINADO'`;

    const histParams: any[] = [];
    if (companyId) {
      histLentQuery += ` AND id_company = $1`;
      histPayQuery += ` AND l.id_company = $1`;
      histExpQuery += ` AND e.id_company = $1`;
      histParams.push(companyId);
    }

    const [histLent] = await this.dataSource.query(histLentQuery, histParams);
    const [histPay] = await this.dataSource.query(histPayQuery, histParams);
    const [histExp] = await this.dataSource.query(histExpQuery, histParams);

    const historicalTotalLent = Number(histLent?.historical_lent || 0);
    const historicalCapitalRecovered = Number(histPay?.historical_recovered || 0);
    const historicalInterestEarned = Number(histPay?.historical_interest || 0);
    const historicalExpenses = Number(histExp?.historical_expenses || 0);
    const netProfit = historicalInterestEarned - historicalExpenses;
    const roi = historicalTotalLent > 0
      ? Number(((netProfit / historicalTotalLent) * 100).toFixed(2))
      : 0;
    const profitMarginOnInterest = historicalInterestEarned > 0
      ? Number(((netProfit / historicalInterestEarned) * 100).toFixed(1))
      : 0;

    // 3. Serie Mensual Agregada de los últimos N meses
    let seriesQuery = `
      WITH months_series AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE) - (($1::int - 1) || ' month')::interval,
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        ) AS m_date
      ),
      loans_monthly AS (
        SELECT 
          DATE_TRUNC('month', l.start_date) as m_date,
          COUNT(l.id) as loans_count,
          COALESCE(SUM(l.amount), 0) as capital_lent
        FROM loans l
        WHERE l.status != 'Eliminado'
          ${companyId ? 'AND l.id_company = $2' : ''}
        GROUP BY DATE_TRUNC('month', l.start_date)
      ),
      payments_monthly AS (
        SELECT 
          DATE_TRUNC('month', p.installment_date) as m_date,
          COALESCE(SUM(p.amount), 0) as total_collected,
          COALESCE(SUM(p.amount * (l.amount / NULLIF(l.amount + l.interest, 0))), 0) as capital_recovered,
          COALESCE(SUM(p.amount * (l.interest / NULLIF(l.amount + l.interest, 0))), 0) as interest_earned
        FROM loan_installments p
        JOIN loans l ON p.loan_id = l.id
        WHERE l.status != 'Eliminado'
          ${companyId ? 'AND l.id_company = $2' : ''}
        GROUP BY DATE_TRUNC('month', p.installment_date)
      ),
      expenses_monthly AS (
        SELECT 
          DATE_TRUNC('month', e.expense_date) as m_date,
          COALESCE(SUM(e.amount), 0) as total_expenses
        FROM expenses e
        WHERE e.status != 'ELIMINADO'
        ${companyId ? 'AND e.id_company = $2' : ''}
        GROUP BY DATE_TRUNC('month', e.expense_date)
      )
      SELECT 
        to_char(ms.m_date, 'YYYY-MM') as month,
        COALESCE(lm.loans_count, 0)::int as loans_count,
        COALESCE(lm.capital_lent, 0)::numeric as capital_lent,
        COALESCE(pm.capital_recovered, 0)::numeric as capital_recovered,
        COALESCE(pm.interest_earned, 0)::numeric as interest_earned,
        COALESCE(pm.total_collected, 0)::numeric as total_collected,
        COALESCE(em.total_expenses, 0)::numeric as total_expenses
      FROM months_series ms
      LEFT JOIN loans_monthly lm ON lm.m_date = ms.m_date
      LEFT JOIN payments_monthly pm ON pm.m_date = ms.m_date
      LEFT JOIN expenses_monthly em ON em.m_date = ms.m_date
      ORDER BY ms.m_date ASC
    `;

    const seriesParams: any[] = [months];
    if (companyId) {
      seriesParams.push(companyId);
    }

    const rawMonths = await this.dataSource.query(seriesQuery, seriesParams);

    let cumulativePortfolio = 0;
    let prevCapitalLent = 0;

    const monthlyEvolution = rawMonths.map((m: any, idx: number) => {
      const monthStr: string = m.month;
      const parts = monthStr.split('-');
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthName = `${MONTH_NAMES_ES[monthIdx]} ${year}`;

      const capitalLent = Number(m.capital_lent || 0);
      const capitalRecovered = Number(m.capital_recovered || 0);
      const interestEarned = Number(m.interest_earned || 0);
      const totalCollected = Number(m.total_collected || 0);
      const expenses = Number(m.total_expenses || 0);
      const netProfitMonth = interestEarned - expenses;
      const netCashFlow = totalCollected - (capitalLent + expenses);

      cumulativePortfolio = Math.max(0, cumulativePortfolio + capitalLent - capitalRecovered);

      let growthRateMoM = 0;
      if (idx > 0 && prevCapitalLent > 0) {
        growthRateMoM = Number((((capitalLent - prevCapitalLent) / prevCapitalLent) * 100).toFixed(1));
      } else if (idx > 0 && prevCapitalLent === 0 && capitalLent > 0) {
        growthRateMoM = 100;
      }
      prevCapitalLent = capitalLent;

      return {
        month: monthStr,
        monthName,
        loansCount: Number(m.loans_count || 0),
        capitalLent,
        capitalRecovered,
        interestEarned,
        totalCollected,
        expenses,
        netProfit: netProfitMonth,
        netCashFlow,
        portfolioBalance: cumulativePortfolio,
        growthRateMoM,
      };
    });

    return {
      summary: {
        activeTotalRemaining,
        activeCapitalInStreet,
        activeInterestRemaining,
        activeOriginalPrincipal,
        activeLoansCount,
        historicalTotalLent,
        historicalCapitalRecovered,
        historicalInterestEarned,
        historicalExpenses,
        netProfit,
        roi,
        profitMarginOnInterest,
      },
      monthlyEvolution,
    };
  }
}

export const AdvancedReportHandlers = [
  GetConsolidatedReportHandler,
  GetCollectorReportHandler,
  GetClientHealthReportHandler,
  GetCapitalInvestmentReportHandler,
];

