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

    constructor(data: any) {
        this.totalLentToday = data.totalLentToday;
        this.collectedToday = data.collectedToday;
        this.activeClients = data.activeClients;
        this.pendingLoans = data.pendingLoans.map(loan => new LoanResponseDto(loan));
    }
}
