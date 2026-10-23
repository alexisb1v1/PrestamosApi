import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyRequestDto {
  @ApiProperty({ example: 'Mi Empresa S.A.C. - Actualizada' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subdomain?: string;

  @ApiProperty({
    required: false,
    example: { features: { risk_scoring: true } },
    description: 'Configuraciones y flags de módulos de la empresa',
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
