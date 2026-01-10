import { Person } from './person.entity';

export class User {
    id?: string; // Optional (auto-generated)
    username: string;
    passwordHash: string;
    profile: string;
    status: string;
    idPeople: number;
    person?: Person;

    constructor(
        username: string,
        passwordHash: string,
        profile: string,
        status: string,
        idPeople: number,
        id?: string,
    ) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.profile = profile;
        this.status = status;
        this.idPeople = idPeople;
        this.id = id;
    }
}
