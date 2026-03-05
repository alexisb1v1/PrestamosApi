import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoanReportQuery } from '../get-loan-report.query';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../../loans/domain/repositories/loan.repository';
import { LoanInstallmentRepository } from '../../../../../loans/domain/repositories/loan-installment.repository';
import { ExpenseRepository } from '../../../../../expenses/domain/repositories/expense.repository';
import {
    LoanReportResponseDto,
    LoanReportSummaryDto,
    LoanReportDayDto,
    LoanReportPaymentDto,
    LoanReportExpenseDto,
} from '../../../../interfaces/http/v1/dto/loan-report-response.dto';

@QueryHandler(GetLoanReportQuery)
export class GetLoanReportHandler implements IQueryHandler<GetLoanReportQuery, LoanReportResponseDto> {
    constructor(
        @Inject(LoanRepository)
        private readonly loanRepository: LoanRepository,
        @Inject(LoanInstallmentRepository)
        private readonly installmentRepository: LoanInstallmentRepository,
        @Inject(ExpenseRepository)
        private readonly expenseRepository: ExpenseRepository,
    ) { }

    async execute(query: GetLoanReportQuery): Promise<LoanReportResponseDto> {
        const { startDate, endDate, companyId, userId } = query;

        // 1. Obtener datos base
        // Necesitamos implementar estos métodos en los repositorios o usar los existentes con filtros
        const loans = await this.loanRepository.findAllInDateRange(startDate, endDate, companyId, userId);
        const installments = await this.installmentRepository.findAllInDateRange(startDate, endDate, companyId, userId);
        const expenses = await this.expenseRepository.findAllInDateRange(startDate, endDate, userId);
        const allActiveLoans = await this.loanRepository.findActiveInRange(startDate, endDate, companyId, userId);

        // 2. Calcular Resumen
        const totalPrestado = loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
        const totalGasto = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

        let totalCobradoEfectivo = 0;
        let totalCobradoYape = 0;

        installments.forEach(inst => {
            const amount = Number(inst.amount);
            if (inst.paymentType?.toLowerCase() === 'yape') {
                totalCobradoYape += amount;
            } else {
                totalCobradoEfectivo += amount;
            }
        });

        const summary: LoanReportSummaryDto = {
            totalGasto,
            totalCobradoEfectivo,
            totalCobradoYape,
            totalCobrado: totalCobradoEfectivo + totalCobradoYape,
            totalPrestado,
        };

        // 3. Agrupar por día
        const pagosPorDia: LoanReportDayDto[] = [];
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        const finalDate = new Date(endDate);
        finalDate.setHours(23, 59, 59, 999);

        while (currentDate <= finalDate) {
            if (currentDate.getDay() !== 0) { // Omitir domingos
                // Formato YYYY-MM-DD local
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                // Pagos cobrados este día
                const dayInstallments = installments.filter(inst => {
                    const instDate = new Date(inst.installmentDate);
                    const instYear = instDate.getFullYear();
                    const instMonth = String(instDate.getMonth() + 1).padStart(2, '0');
                    const instDay = String(instDate.getDate()).padStart(2, '0');
                    return `${instYear}-${instMonth}-${instDay}` === dateStr;
                });

                // Gastos este día
                const dayExpenses = expenses.filter(exp => {
                    const expDate = new Date(exp.expenseDate);
                    const expYear = expDate.getFullYear();
                    const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
                    const expDay = String(expDate.getDate()).padStart(2, '0');
                    return `${expYear}-${expMonth}-${expDay}` === dateStr;
                });

                // Calcular Pendientes para este día
                const activeLoansThisDay = allActiveLoans.filter(loan => {
                    const loanStart = new Date(loan.startDate);
                    const loanEnd = new Date(loan.endDate);

                    // Normalizar fechas para comparación (solo YYYY-MM-DD)
                    const sYear = loanStart.getFullYear();
                    const sMonth = String(loanStart.getMonth() + 1).padStart(2, '0');
                    const sDay = String(loanStart.getDate()).padStart(2, '0');
                    const sDate = `${sYear}-${sMonth}-${sDay}`;

                    const eYear = loanEnd.getFullYear();
                    const eMonth = String(loanEnd.getMonth() + 1).padStart(2, '0');
                    const eDay = String(loanEnd.getDate()).padStart(2, '0');
                    const eDate = `${eYear}-${eMonth}-${eDay}`;

                    return sDate < dateStr && eDate >= dateStr;
                });

                const dayPayments: LoanReportPaymentDto[] = dayInstallments.map(inst => ({
                    cliente: inst.loan?.person ? `${inst.loan.person.firstName} ${inst.loan.person.lastName}` : 'N/A',
                    monto: Number(inst.amount),
                    estado: 'COBRADO',
                    metodo: inst.paymentType || 'EFECTIVO'
                }));

                const paidLoanIds = new Set(dayInstallments.map(inst => inst.loanId!));

                activeLoansThisDay.forEach(loan => {
                    if (!paidLoanIds.has(loan.id!)) {
                        dayPayments.push({
                            cliente: loan.person ? `${loan.person.firstName} ${loan.person.lastName}` : 'N/A',
                            monto: Number(loan.fee),
                            estado: 'PENDIENTE',
                            metodo: ''
                        });
                    }
                });

                pagosPorDia.push({
                    fecha: dateStr,
                    pagos: dayPayments,
                    gastos: dayExpenses.map(exp => ({
                        descripcion: exp.description,
                        monto: Number(exp.amount),
                        usuario: exp.userId
                    }))
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return { summary, pagosPorDia };
    }
}
