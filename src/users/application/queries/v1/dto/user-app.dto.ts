export class PersonAppDto {
  id?: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthday: Date | null;
}

export class UserAppDto {
  id?: string;
  username: string;
  profile: string;
  status: string;
  idPeople: number;
  isDayClosed: boolean;
  idCompany?: string;
  person?: PersonAppDto;
}

export class GetUserResultDto {
  user: UserAppDto;
  person?: PersonAppDto;
}
