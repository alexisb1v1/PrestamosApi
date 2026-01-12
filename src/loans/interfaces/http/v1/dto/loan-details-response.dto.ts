import { ApiProperty } from '@nestjs/swagger';
import { Loan } from '../../../../domain/entities/loan.entity';

export class LoanInstallmentDetailDto {
    @ApiProperty()
    date: Date;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    status: string;

    @ApiProperty()
    registeredBy: string;
}

export class LoanDetailsResponseDto {
    @ApiProperty()
    startDate: Date;

    @ApiProperty()
    endDate: Date;

    @ApiProperty({ type: [LoanInstallmentDetailDto] })
    installments: LoanInstallmentDetailDto[];

    constructor(loan: Loan) {
        this.startDate = loan.startDate;
        this.endDate = loan.endDate;
        this.installments = (loan.installments || []).map(inst => ({
            date: inst.installmentDate,
            amount: inst.amount,
            status: inst.status,
            registeredBy: inst.userName || 'Unknown'
        }));
    }
}
