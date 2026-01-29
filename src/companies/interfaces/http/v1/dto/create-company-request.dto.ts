import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCompanyRequestDto {
    @ApiProperty({ example: 'Mi Empresa S.A.C.' })
    @IsNotEmpty()
    @IsString()
    companyName: string;
}
