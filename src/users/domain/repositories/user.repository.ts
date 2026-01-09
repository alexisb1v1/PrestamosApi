import { User } from '../entities/user.entity';

export interface UserRepository {
    save(user: User): Promise<string>; // Returns the generated user ID
    findByUsername(username: string): Promise<User | null>;
}

export const UserRepository = Symbol('UserRepository');
