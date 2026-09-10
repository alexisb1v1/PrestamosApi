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

  @ApiProperty({ type: [PublicLoanInstallmentDetailDto] })
  installments: PublicLoanInstallmentDetailDto[];

  constructor(loan: LoanAppDto) {
    this.clientName = loan.clientName || 'Cliente';
    this.amount = loan.amount;
    this.interest = loan.interest || 0;
    this.fee = loan.fee;
    this.days = loan.days;
    this.remainingAmount = loan.remainingAmount;
    this.startDate = loan.startDate;
    this.endDate = loan.endDate;
    this.status = loan.status;
    this.installments = (loan.installments || []).map((inst) => ({
      id: inst.id,
      date: inst.date,
      amount: inst.amount,
      status: inst.status,
    }));
  }
}
