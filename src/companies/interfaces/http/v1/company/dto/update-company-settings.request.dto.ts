import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';

export class UpdateCompanySettingsRequestDto {
  @ApiProperty({
    required: false,
    description: 'Personalización visual del tenant (colores e isotipo/logo)',
    example: {
      primaryColor: '#4147eb',
      secondaryColor: '#100069',
      iconUrl: 'data:image/png;base64,...',
    },
  })
  @IsOptional()
  @IsObject()
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    iconUrl?: string;
  };

  @ApiProperty({
    required: false,
    description: 'Reglas y parámetros de préstamos (días, interés, override > 1000)',
    example: {
      defaultDays: 24,
      defaultInterestRate: 20,
      allowCollectorOverrideOver1000: true,
    },
  })
  @IsOptional()
  @IsObject()
  loans?: {
    defaultDays?: number;
    defaultInterestRate?: number;
    allowCollectorOverrideOver1000?: boolean;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;
}
