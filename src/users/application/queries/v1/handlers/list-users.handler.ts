import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListUsersQuery } from '../list-users.query';
import { Inject } from '@nestjs/common';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { UserAppDto } from '../dto/user-app.dto';
import { UserMapper } from '../mappers/user.mapper';
import { Result, ok } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<
  ListUsersQuery,
  Result<UserAppDto[], AppError>
> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Lista los usuarios del sistema filtrando por nombre de usuario y compañía.
   *
   * @param query - Parámetros de filtrado:
   *   - `username`: Nombre de usuario (opcional).
   *   - `idCompany`: ID de la compañía (opcional).
   *
   * @returns `Result.ok(UserAppDto[])` con la lista de usuarios mapeados.
   */
  async execute(
    query: ListUsersQuery,
  ): Promise<Result<UserAppDto[], AppError>> {
    const users = await this.userRepository.findAll(
      query.username,
      query.idCompany,
    );
    return ok(users.map((u) => UserMapper.toUserAppDto(u)));
  }
}
