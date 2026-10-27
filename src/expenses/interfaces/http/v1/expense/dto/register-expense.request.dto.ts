import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class RegisterExpenseRequestDto {
  @ApiProperty({ example: 'Pasajes', description: 'Descripción del gasto' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  description: string;

  @ApiProperty({ example: 15.5, description: 'Monto del gasto' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: '1',
    description: 'ID del usuario que registra el gasto',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    example: '102',
    description: 'ID de la empresa (opcional, si no se envía se infiere del usuario)',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyId?: string;
}

