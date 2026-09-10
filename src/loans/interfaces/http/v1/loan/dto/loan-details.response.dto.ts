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

  @ApiProperty({ type: [LoanInstallmentDetailDto] })
  installments: LoanInstallmentDetailDto[];

  constructor(loan: LoanAppDto) {
    this.startDate = loan.startDate;
    this.endDate = loan.endDate;
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
