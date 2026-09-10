import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyRequestDto {
  @ApiProperty({ example: 'Mi Empresa S.A.C. - Actualizada' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subdomain?: string;
}
