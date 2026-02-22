import { ApiProperty } from '@nestjs/swagger';
import { LoanResponseDto } from './loan.response.dto';

export class DashboardResponseDto {
  @ApiProperty({ example: 1000.0, description: 'Total prestado el día de hoy' })
  totalLentToday: number;

  @ApiProperty({ example: 450.0, description: 'Total cobrado el día de hoy' })
  collectedToday: number;

  @ApiProperty({
    example: 15,
    description: 'Cantidad de clientes con préstamos activos',
  })
  activeClients: number;

  @ApiProperty({
    type: [LoanResponseDto],
    description: 'Listado de préstamos pendientes de cobro para hoy',
  })
  pendingLoans: LoanResponseDto[];

  @ApiProperty({
    example: { yape: 5, efectivo: 5 },
    description: 'Detalle de lo cobrado hoy por tipo de pago',
  })
  detailCollectedToday: { yape: number; efectivo: number };

  @ApiProperty({ example: 100.0, description: 'Total gastado el día de hoy' })
  totalExpensesToday: number;

  @ApiProperty({
    example: 85.5,
    description: 'Indicador de recuperación de capital (Termómetro)',
  })
  thermometer: number;

  constructor(
    data: import('../../../../domain/repositories/loan.repository').DashboardStats,
  ) {
    this.totalLentToday = data.totalLentToday;
    this.collectedToday = data.collectedToday;
    this.totalExpensesToday = data.totalExpensesToday;
    this.activeClients = data.activeClients;
    this.thermometer = data.thermometer;
    this.pendingLoans = data.pendingLoans.map(
      (loan) => new LoanResponseDto(loan),
    );
    this.detailCollectedToday = data.detailCollectedToday;
  }
}
