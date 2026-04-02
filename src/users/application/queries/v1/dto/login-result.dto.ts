export class PersonDataDto {
  id: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthday?: Date;
}

export class UserDataDto {
  id: string;
  username: string;
  profile: string;
  status: string;
  isDayClosed: boolean;
  idCompany?: string;
  companyStatus?: string;
  collectionOrder?: string[];
  person: PersonDataDto;
}

export class LoginResultDto {
  token: string;
  user: UserDataDto;
}
