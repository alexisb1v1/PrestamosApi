import { ApiProperty } from '@nestjs/swagger';
import { CompanyAppDto } from '../../../../../application/queries/v1/dto/company-app.dto';

export class CompanyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  label?: string;

  constructor(company: CompanyAppDto) {
    this.id = company.id!;
    this.companyName = company.companyName;

    // Standardize status for frontend (English)
    const rawStatus = company.status?.toUpperCase();
    if (rawStatus === 'ACTIVO') {
      this.status = 'ACTIVE';
    } else if (rawStatus === 'INACTIVO') {
      this.status = 'INACTIVE';
    } else if (rawStatus === 'SUSPENDIDO') {
      this.status = 'SUSPENDED';
    } else {
      this.status = rawStatus;
    }

    this.createdAt = company.createdAt;
    this.label = company.label;
  }
}
