import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLoanInfoDto {
  @ApiProperty({
    example: '987654321',
    description: 'New phone number for the loan borrower',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'Calle Nueva 456, Surco',
    description: 'New address for the loan borrower',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  address: string;
}
