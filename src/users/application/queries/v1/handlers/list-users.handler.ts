import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListUsersQuery } from '../list-users.query';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { User } from '../../../../domain/entities/user.entity';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery, User[]> {
    constructor(
        @Inject(UserRepository)
        private readonly userRepository: UserRepository,
    ) { }

    async execute(query: ListUsersQuery): Promise<User[]> {
        return this.userRepository.findAll(query.username);
    }
}
