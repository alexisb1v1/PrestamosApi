import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { Person } from '../../domain/entities/person.entity';
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
        const entity = await this.typeOrmRepository.findOne({ where: { username } });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    async findById(id: string): Promise<User | null> {
        const entity = await this.typeOrmRepository.findOne({ where: { id } });
        if (!entity) return null;
        return this.toDomain(entity);
    }

    async findAll(username?: string): Promise<User[]> {
        const options: any = {
            relations: ['person'],
        };
        if (username) {
            options.where = { username: Like(`%${username}%`) };
        }
        const entities = await this.typeOrmRepository.find(options);
        return entities.map(entity => this.toDomain(entity));
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
        const user = new User(
            entity.username,
            entity.passwordHash,
            entity.profile,
            entity.status,
            Number(entity.idPeople),
            entity.id,
        );

        if (entity.person) {
            user.person = new Person(
                entity.person.documentType,
                entity.person.documentNumber,
                entity.person.firstName,
                entity.person.lastName,
                entity.person.birthday,
                entity.person.id,
            );
        }

        return user;
    }
}
