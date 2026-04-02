import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum CompanyStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}

export class UpdateCompanyStatusRequestDto {
    @ApiProperty({
        description: 'New status for the company',
        enum: CompanyStatus,
        example: 'ACTIVE',
    })
    @IsEnum(CompanyStatus)
    @IsNotEmpty()
    status: string;
}
