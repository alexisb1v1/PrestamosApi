import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterLoanInstallmentDto {
  @ApiProperty({ example: '1', description: 'The ID of the loan' })
  @IsNotEmpty()
  @IsString()
  loanId: string;

  @ApiProperty({ example: 50.5, description: 'The amount of the installment' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: '1',
    description: 'The ID of the user (collector) registering the installment',
  })
  @IsNotEmpty()
  @Transform(({ value }) => String(value))
  @IsString()
  userId: string;

  @ApiProperty({
    example: 'CASH',
    description: 'The type of payment (e.g., CASH, TRANSFER)',
  })
  @IsNotEmpty()
  @IsString()
  paymentType: string;
}
