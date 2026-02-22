import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the person requesting the loan',
  })
  @IsNumber()
  @IsNotEmpty()
  idPeople: number;

  @ApiProperty({ example: 5000000.0, description: 'Loan amount' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 100,
    description: 'ID of the user creating the loan',
  })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    example: 'Calle 123, Ciudad',
    description: 'Address of the borrower',
  })
  @IsNotEmpty()
  address: string;
}
