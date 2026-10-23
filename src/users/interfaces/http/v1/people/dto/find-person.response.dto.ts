export class FindPersonResponseDto {
  id: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  phone?: string;
  address?: string;
  creditScore?: number;
  suggestedLimit?: number | null;
  creditScoreDetail?: Record<string, any> | null;
  riskScoringEnabled?: boolean;
}

