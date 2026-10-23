export class CompanyAppDto {
  id: string;
  companyName: string;
  status: string;
  createdAt: Date;
  label?: string;
  subdomain?: string;
  keyToken?: string;
  settings?: Record<string, any>;
}
