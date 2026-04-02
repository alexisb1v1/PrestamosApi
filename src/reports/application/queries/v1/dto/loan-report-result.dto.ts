export interface ReportSummaryAppDto {
  totalGasto: number;
  totalCobradoEfectivo: number;
  totalCobradoYape: number;
  totalCobrado: number;
  totalPrestado: number;
}

export interface ReportPaymentAppDto {
  cliente: string;
  monto: number;
  estado: string;
  metodo: string;
}

export interface ReportExpenseAppDto {
  descripcion: string;
  monto: number;
  usuario: string;
}

export interface ReportDayAppDto {
  fecha: string;
  pagos: ReportPaymentAppDto[];
  gastos: ReportExpenseAppDto[];
}

export class LoanReportResultDto {
  summary: ReportSummaryAppDto;
  pagosPorDia: ReportDayAppDto[];
}
