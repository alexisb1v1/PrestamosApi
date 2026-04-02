import { Loan } from '../../../../../loans/domain/entities/loan.entity';
import { LoanInstallment } from '../../../../../loans/domain/entities/loan-installment.entity';
import { Expense } from '../../../../../expenses/domain/entities/expense.entity';
import {
  LoanReportResultDto,
  ReportSummaryAppDto,
  ReportDayAppDto,
  ReportPaymentAppDto,
} from '../dto/loan-report-result.dto';

export class ReportMapper {
  static toLoanReportResult(
    startDate: Date,
    endDate: Date,
    loans: Loan[],
    installments: LoanInstallment[],
    expenses: Expense[],
    allActiveLoans: Loan[],
  ): LoanReportResultDto {
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

    const summary: ReportSummaryAppDto = {
      totalGasto,
      totalCobradoEfectivo,
      totalCobradoYape,
      totalCobrado: totalCobradoEfectivo + totalCobradoYape,
      totalPrestado,
    };

    const pagosPorDia: ReportDayAppDto[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const finalDate = new Date(endDate);
    finalDate.setHours(23, 59, 59, 999);

    while (currentDate <= finalDate) {
      if (currentDate.getDay() !== 0) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const dayInstallments = installments.filter(inst => {
          const instDate = new Date(inst.installmentDate);
          const instYear = instDate.getFullYear();
          const instMonth = String(instDate.getMonth() + 1).padStart(2, '0');
          const instDay = String(instDate.getDate()).padStart(2, '0');
          return `${instYear}-${instMonth}-${instDay}` === dateStr;
        });

        const dayExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.expenseDate);
          const expYear = expDate.getFullYear();
          const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
          const expDay = String(expDate.getDate()).padStart(2, '0');
          return `${expYear}-${expMonth}-${expDay}` === dateStr;
        });

        const activeLoansThisDay = allActiveLoans.filter(loan => {
          const loanStart = new Date(loan.startDate);
          const loanEnd = new Date(loan.endDate);
          const sDate = `${loanStart.getFullYear()}-${String(loanStart.getMonth() + 1).padStart(2, '0')}-${String(loanStart.getDate()).padStart(2, '0')}`;
          const eDate = `${loanEnd.getFullYear()}-${String(loanEnd.getMonth() + 1).padStart(2, '0')}-${String(loanEnd.getDate()).padStart(2, '0')}`;
          return sDate < dateStr && eDate >= dateStr;
        });

        const dayPayments: ReportPaymentAppDto[] = dayInstallments.map(inst => ({
          cliente: inst.loan?.person ? `${inst.loan.person.firstName} ${inst.loan.person.lastName}` : 'N/A',
          monto: Number(inst.amount),
          estado: 'COBRADO',
          metodo: inst.paymentType || 'EFECTIVO',
        }));

        const paidLoanIds = new Set(dayInstallments.map(inst => inst.loanId!));

        activeLoansThisDay.forEach(loan => {
          if (!paidLoanIds.has(loan.id!)) {
            dayPayments.push({
              cliente: loan.person ? `${loan.person.firstName} ${loan.person.lastName}` : 'N/A',
              monto: Number(loan.fee),
              estado: 'PENDIENTE',
              metodo: '',
            });
          }
        });

        pagosPorDia.push({
          fecha: dateStr,
          pagos: dayPayments,
          gastos: dayExpenses.map(exp => ({
            descripcion: exp.description,
            monto: Number(exp.amount),
            usuario: exp.userId,
          })),
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { summary, pagosPorDia } as LoanReportResultDto;
  }
}
