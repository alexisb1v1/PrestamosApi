import { ApiProperty } from '@nestjs/swagger';
import { LoanAppDto } from '@loans/application/queries/v1/dto/loan-app.dto';

export class LoanInstallmentDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  registeredBy: string;

  @ApiProperty()
  registeredByUserId: string;
}

export class LoanDetailsResponseDto {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ required: false })
  status?: string;

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

  @ApiProperty({ required: false })
  isPersonSynced?: boolean;

  @ApiProperty({ type: [LoanInstallmentDetailDto] })
  installments: LoanInstallmentDetailDto[];

  constructor(loan: LoanAppDto) {
    this.startDate = loan.startDate;
    this.endDate = loan.endDate;
    this.status = loan.status;
    this.liquidationDate = loan.liquidationDate;
    this.completedOnTime = loan.completedOnTime;
    this.earlyLiquidationDays = loan.earlyLiquidationDays;
    this.extensionDays = loan.extensionDays;
    this.delayDays = loan.delayDays;
    this.creditRating = loan.creditRating;
    this.isPersonSynced = loan.isPersonSynced ?? true;
    this.installments = (loan.installments || []).map((inst) => ({
      id: inst.id,
      date: inst.date,
      amount: inst.amount,
      status: inst.status,
      registeredBy: inst.registeredBy,
      registeredByUserId: inst.registeredByUserId,
    }));
  }
}

