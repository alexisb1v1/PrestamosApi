import { ApiProperty } from '@nestjs/swagger';
import { LoanAppDto } from '@loans/application/queries/v1/dto/loan-app.dto';

export class PublicLoanInstallmentDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;
}

export class PublicLoanDetailsResponseDto {
  @ApiProperty()
  clientName: string;

  @ApiProperty({ required: false })
  tenantName: string;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  isLiquidated: boolean;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  interest: number;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  days: number;

  @ApiProperty()
  remainingAmount: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  liquidationDate?: Date;

  @ApiProperty({ required: false })
  completedOnTime?: boolean;

  @ApiProperty({ required: false })
  earlyLiquidationDays?: number;

  @ApiProperty({ required: false })
  extensionDays?: number;

  @ApiProperty({ required: false })
  delayDays?: number;

  @ApiProperty({ required: false })
  creditRating?: string | null;

  @ApiProperty({ type: [PublicLoanInstallmentDetailDto] })
  installments: PublicLoanInstallmentDetailDto[];

  constructor(
    loan: LoanAppDto,
    meta?: { tenantName?: string; isExpired?: boolean },
  ) {
    this.clientName = loan.clientName || 'Cliente';
    this.tenantName = meta?.tenantName || 'NeoCobros';
    this.isExpired = meta?.isExpired ?? false;
    this.isLiquidated =
      loan.status === 'Liquidado' || (loan.remainingAmount || 0) <= 0;
    this.amount = loan.amount;
    this.interest = loan.interest || 0;
    this.fee = loan.fee;
    this.days = loan.days;
    this.remainingAmount = loan.remainingAmount;
    this.startDate = loan.startDate;
    this.endDate = loan.endDate;
    this.status = loan.status;
    this.liquidationDate = loan.liquidationDate;
    this.completedOnTime = loan.completedOnTime;
    this.earlyLiquidationDays = loan.earlyLiquidationDays;
    this.extensionDays = loan.extensionDays;
    this.delayDays = loan.delayDays;
    this.creditRating = loan.creditRating;
    this.installments = (loan.installments || []).map((inst) => ({
      id: inst.id,
      date: inst.date,
      amount: inst.amount,
      status: inst.status,
    }));
  }
}
