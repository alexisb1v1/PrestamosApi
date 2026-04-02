import { Company } from '../../../../domain/entities/company.entity';
import { CompanyAppDto } from '../dto/company-app.dto';

export class CompanyMapper {
  static toAppDto(company: Company): CompanyAppDto {
    return {
      id: company.id!,
      companyName: company.companyName,
      status: company.status,
      createdAt: company.createdAt,
      label: company.label,
    };
  }
}
