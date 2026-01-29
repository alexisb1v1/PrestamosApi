import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCompanyRequestDto {
    @ApiProperty({ example: 'Mi Empresa S.A.C. - Actualizada' })
    @IsNotEmpty()
    @IsString()
    companyName: string;
}
