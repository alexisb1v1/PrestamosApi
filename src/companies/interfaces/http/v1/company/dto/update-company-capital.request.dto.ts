import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanyCapitalRequestDto {
  @ApiProperty({
    description: 'Monto del capital a establecer o inyectar',
    example: 2000.00,
  })
  @IsNumber()
  @IsPositive({ message: 'El capital debe ser un monto positivo mayor a cero' })
  amount: number;

  @ApiProperty({
    required: false,
    description: 'Nota u observación explicativa de la inyección de fondos',
    example: 'Apertura de operaciones / Aumento de capital de trabajo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}

