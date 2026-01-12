import { Loan } from '../../../../domain/entities/loan.entity';
import { ApiProperty } from '@nestjs/swagger';

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

    @ApiProperty({ required: false })
    documentNumber?: string;

    @ApiProperty({ required: false })
    clientName?: string;

    @ApiProperty({ required: false })
    collectorName?: string;

    @ApiProperty({ example: 1, description: 'Indicador si ya se realizó el pago hoy (1: Si, 0: No)' })
    paidToday: number;

    @ApiProperty({ example: 450.00, description: 'Monto total restante del préstamo (Capital + Interés - Abonos)' })
    remainingAmount: number;

    constructor(loan: Loan) {
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
        this.paidToday = loan.paidToday ?? 0;
        this.remainingAmount = loan.remainingAmount ?? (loan.amount + loan.interest);

        if (loan.person) {
            this.documentNumber = loan.person.documentNumber;
            this.clientName = `${loan.person.firstName} ${loan.person.lastName}`;
        }

        if (loan.user) {
            this.collectorName = loan.user.username;
        }
    }
}
