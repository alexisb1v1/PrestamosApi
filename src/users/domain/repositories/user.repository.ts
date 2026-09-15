import { User } from '../entities/user.entity';

export interface UserRepository {
  save(user: User): Promise<string>;
  findByUsername(username: string): Promise<User | null>;
  findByUsernameAndSubdomain(username: string, subdomain: string): Promise<User | null>;
  findByUsernameAndCompany(username: string, idCompany: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(username?: string, idCompany?: number): Promise<User[]>;
  updatePasswordHash(userId: string, newPasswordHash: string): Promise<void>;
  updateCollectionOrder(userId: string, order: string[]): Promise<void>;
}

export const UserRepository = Symbol('UserRepository');
