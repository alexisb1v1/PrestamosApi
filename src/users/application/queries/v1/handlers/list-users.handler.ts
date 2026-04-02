import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListUsersQuery } from '../list-users.query';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { UserAppDto } from '../dto/user-app.dto';
import { UserMapper } from '../mappers/user.mapper';
import { Result, ok } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery, Result<UserAppDto[], AppError>> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<Result<UserAppDto[], AppError>> {
    const users = await this.userRepository.findAll(query.username, query.idCompany);
    return ok(users.map(u => UserMapper.toUserAppDto(u)));
  }
}
