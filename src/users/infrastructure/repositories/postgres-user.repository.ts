import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class PostgresUserRepository implements UserRepository {
    constructor(
        @InjectRepository(UserEntity)
        private readonly typeOrmRepository: Repository<UserEntity>,
    ) { }

    async save(user: User): Promise<string> {
        const entity = this.toEntity(user);
        const saved = await this.typeOrmRepository.save(entity);
        return saved.id;
    }

    async findByUsername(username: string): Promise<User | null> {
        const entity = await this.typeOrmRepository.findOneBy({ username });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    private toEntity(user: User): UserEntity {
        const entity = new UserEntity();
        if (user.id) {
            entity.id = user.id;
        }
        entity.username = user.username;
        entity.passwordHash = user.passwordHash;
        entity.profile = user.profile;
        entity.status = user.status;
        entity.idPeople = user.idPeople.toString();
        return entity;
    }

    private toDomain(entity: UserEntity): User {
        return new User(
            entity.username,
            entity.passwordHash,
            entity.profile,
            entity.status,
            Number(entity.idPeople),
            entity.id,
        );
    }
}
