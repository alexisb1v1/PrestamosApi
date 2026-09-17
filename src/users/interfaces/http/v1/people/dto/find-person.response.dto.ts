export class FindPersonResponseDto {
  id: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthday: string | null;
  phone?: string;
  address?: string;
}
