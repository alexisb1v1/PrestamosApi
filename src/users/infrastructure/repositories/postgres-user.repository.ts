import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { User } from '@users/domain/entities/user.entity';
import { Person } from '@users/domain/entities/person.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class PostgresUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly typeOrmRepository: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<string> {
    const entity = this.toEntity(user);
    const saved = await this.typeOrmRepository.save(entity);
    return saved.id;
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.typeOrmRepository.findOne({
      where: { username },
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.typeOrmRepository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async updatePasswordHash(
    userId: string,
    newPasswordHash: string,
  ): Promise<void> {
    await this.typeOrmRepository.update(
      { id: userId },
      { passwordHash: newPasswordHash },
    );
  }

  async updateCollectionOrder(userId: string, order: string[]): Promise<void> {
    await this.typeOrmRepository.update(
      { id: userId },
      { collectionOrder: order },
    );
  }

  async findAll(username?: string, idCompany?: number): Promise<User[]> {
    const where: import('typeorm').FindOptionsWhere<UserEntity> = {};
    if (username) {
      where.username = Like(`%${username}%`);
    }
    if (idCompany) {
      where.idCompany = idCompany.toString();
    }
    const entities = await this.typeOrmRepository.find({
      relations: ['person'],
      where,
    });
    return entities.map((entity) => this.toDomain(entity));
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
    entity.isDayClosed = user.isDayClosed;
    if (user.idCompany) {
      entity.idCompany = user.idCompany;
    }
    entity.collectionOrder = user.collectionOrder ?? null;
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
      entity.isDayClosed,
      entity.idCompany,
      entity.collectionOrder ?? undefined,
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
