import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../../../../domain/entities/company.entity';

export class CompanyResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    companyName: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    createdAt: Date;

    constructor(company: Company) {
        this.id = company.id!;
        this.companyName = company.companyName;
        this.status = company.status;
        this.createdAt = company.createdAt;
    }
}
