import { ApiProperty } from '@nestjs/swagger';

export class LoanReportSummaryDto {
    @ApiProperty()
    totalGasto: number;

    @ApiProperty()
    totalCobradoEfectivo: number;

    @ApiProperty()
    totalCobradoYape: number;

    @ApiProperty()
    totalCobrado: number;

    @ApiProperty()
    totalPrestado: number;
}

export class LoanReportPaymentDto {
    @ApiProperty()
    cliente: string;

    @ApiProperty()
    monto: number;

    @ApiProperty()
    estado: string;

    @ApiProperty({ nullable: true })
    metodo: string;
}

export class LoanReportExpenseDto {
    @ApiProperty()
    descripcion: string;

    @ApiProperty()
    monto: number;

    @ApiProperty()
    usuario: string;
}

export class LoanReportDayDto {
    @ApiProperty()
    fecha: string;

    @ApiProperty({ type: [LoanReportPaymentDto] })
    pagos: LoanReportPaymentDto[];

    @ApiProperty({ type: [LoanReportExpenseDto] })
    gastos: LoanReportExpenseDto[];
}

export class LoanReportResponseDto {
    @ApiProperty({ type: LoanReportSummaryDto })
    summary: LoanReportSummaryDto;

    @ApiProperty({ type: [LoanReportDayDto] })
    pagosPorDia: LoanReportDayDto[];
}
