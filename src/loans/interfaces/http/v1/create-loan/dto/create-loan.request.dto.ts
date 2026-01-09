import { IsDateString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
    @ApiProperty({ example: 1, description: 'ID of the person requesting the loan' })
    @IsNumber()
    @IsNotEmpty()
    idPeople: number;

    @ApiProperty({ example: '2024-01-01', description: 'Start date of the loan' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ example: '2024-12-31', description: 'End date of the loan' })
    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @ApiProperty({ example: 5000000.0, description: 'Loan amount' })
    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    amount: number;

    @ApiProperty({ example: 12.5, description: 'Interest amount or rate' })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    interest: number;

    @ApiProperty({ example: 5000.0, description: 'Fee amount' })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    fee: number;

    @ApiProperty({ example: 100, description: 'ID of the user creating the loan' })
    @IsNumber()
    @IsNotEmpty()
    userId: number;
}
