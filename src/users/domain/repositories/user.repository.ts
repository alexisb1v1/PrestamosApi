import { User } from '../entities/user.entity';

export interface UserRepository {
    save(user: User): Promise<string>; // Returns the generated user ID
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(username?: string, idCompany?: number): Promise<User[]>;
}

export const UserRepository = Symbol('UserRepository');
