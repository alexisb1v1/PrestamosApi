import { ApiProperty } from '@nestjs/swagger';
import { LoanResponseDto } from './loan-response.dto';

export class DashboardResponseDto {
    @ApiProperty({ example: 1000.00, description: 'Total prestado el día de hoy' })
    totalLentToday: number;

    @ApiProperty({ example: 450.00, description: 'Total cobrado el día de hoy' })
    collectedToday: number;

    @ApiProperty({ example: 15, description: 'Cantidad de clientes con préstamos activos' })
    activeClients: number;

    @ApiProperty({ type: [LoanResponseDto], description: 'Listado de préstamos pendientes de cobro para hoy' })
    pendingLoans: LoanResponseDto[];

    @ApiProperty({
        example: { yape: 5, efectivo: 5 },
        description: 'Detalle de lo cobrado hoy por tipo de pago'
    })
    detailCollectedToday: { yape: number; efectivo: number };

    @ApiProperty({ example: 100.00, description: 'Total gastado el día de hoy' })
    totalExpensesToday: number;

    constructor(data: any) {
        this.totalLentToday = data.totalLentToday;
        this.collectedToday = data.collectedToday;
        this.totalExpensesToday = data.totalExpensesToday || 0;
        this.activeClients = data.activeClients;
        this.pendingLoans = data.pendingLoans.map(loan => new LoanResponseDto(loan));
        this.detailCollectedToday = data.detailCollectedToday || { yape: 0, efectivo: 0 };
    }
}
