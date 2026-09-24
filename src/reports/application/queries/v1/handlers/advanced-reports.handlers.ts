import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetConsolidatedReportQuery } from '../get-consolidated-report.query';
import { GetCollectorReportQuery } from '../get-collector-report.query';
import { GetClientHealthReportQuery } from '../get-client-health-report.query';
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
    
    let expensesQuery = `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE expense_date BETWEEN $1 AND $2`;
    const expParams: any[] = [startDate, endDate];

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
        MAX(u.id) as user_id,
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
        (SELECT COALESCE(SUM(amount), 0) FROM expenses e WHERE e.user_id IN (SELECT id FROM "user" WHERE id_people = pe.id) AND e.expense_date BETWEEN $1 AND $2) as gastos_ruta
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

    queryStr += ` GROUP BY pe.id, pe.first_name, pe.last_name, pe.document_number`;

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
          WHERE expense_date BETWEEN $1 AND $2 AND user_id = $3
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
          WHERE e.expense_date BETWEEN $1 AND $2 AND e.user_id = $3
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
        id, amount, interest, fee, status, start_date, created_at,
        (SELECT COALESCE(SUM(amount), 0) FROM loan_installments p WHERE p.loan_id = loans.id) as total_paid
      FROM loans 
      WHERE id_people = $1
      ORDER BY created_at DESC
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

export const AdvancedReportHandlers = [
  GetConsolidatedReportHandler,
  GetCollectorReportHandler,
  GetClientHealthReportHandler,
];
