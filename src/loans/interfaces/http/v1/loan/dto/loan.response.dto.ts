import { ApiProperty } from '@nestjs/swagger';
import { LoanAppDto } from '../../../../../application/queries/v1/dto/loan-app.dto';

export class LoanResponseDto {
  @ApiProperty({ required: false })
  id?: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  interest: number;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  days: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  phone?: string;

  @ApiProperty({ required: false })
  documentNumber?: string;

  @ApiProperty({ required: false })
  clientName?: string;

  @ApiProperty({ required: false })
  collectorName?: string;

  @ApiProperty({
    example: 1,
    description: 'Indicador si ya se realizó el pago hoy (1: Si, 0: No)',
  })
  paidToday: number;

  @ApiProperty({
    example: 450.0,
    description:
      'Monto total restante del préstamo (Capital + Interés - Abonos)',
  })
  remainingAmount: number;

  @ApiProperty({
    example: 0,
    description: 'Indicador si hoy está en el intervalo de pago (1: Si, 0: No)',
  })
  inIntervalPayment: number;

  @ApiProperty({ required: false })
  personId?: string;

  @ApiProperty({ required: false })
  collectorId?: string;

  @ApiProperty({ required: false })
  companyId?: string;

  constructor(loan: LoanAppDto) {
    this.id = loan.id;
    this.startDate = loan.startDate;
    this.endDate = loan.endDate;
    this.amount = loan.amount;
    this.interest = loan.interest;
    this.fee = loan.fee;
    this.days = loan.days;
    this.createdAt = loan.createdAt;
    this.status = loan.status;
    this.address = loan.address;
    this.phone = loan.phone;
    this.paidToday = loan.paidToday;
    this.remainingAmount = loan.remainingAmount;
    this.inIntervalPayment = loan.inIntervalPayment;
    this.personId = loan.idPeople;
    this.collectorId = loan.userId;
    this.documentNumber = loan.documentNumber;
    this.clientName = loan.clientName;
    this.collectorName = loan.collectorName;
    this.companyId = loan.companyId;
  }
}
