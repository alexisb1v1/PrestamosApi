import { Person } from './person.entity';

export class User {
  id?: string; // Optional (auto-generated)
  username: string;
  passwordHash: string;
  profile: string;
  status: string;
  idPeople: number;
  person?: Person;
  isDayClosed: boolean;
  idCompany?: string; // Company ID
  collectionOrder?: string[];

  constructor(
    username: string,
    passwordHash: string,
    profile: string,
    status: string,
    idPeople: number,
    id?: string,
    isDayClosed: boolean = false,
    idCompany?: string,
    collectionOrder?: string[],
  ) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.profile = profile;
    this.status = status;
    this.idPeople = idPeople;
    this.id = id;
    this.isDayClosed = isDayClosed;
    this.idCompany = idCompany;
    this.collectionOrder = collectionOrder;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE' || this.status === 'ACTIVO';
  }
}
