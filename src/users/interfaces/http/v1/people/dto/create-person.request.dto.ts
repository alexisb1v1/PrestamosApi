import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonDto {
  @ApiProperty({ example: 'DNI' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsDateString()
  birthday?: string;
}
