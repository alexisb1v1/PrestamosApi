import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserQuery } from '../get-user.query';
import { Inject } from '@nestjs/common';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { GetUserResultDto } from '../dto/user-app.dto';
import { UserMapper } from '../mappers/user.mapper';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<
  GetUserQuery,
  Result<GetUserResultDto, AppError>
> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  /**
   * Obtiene la información de un usuario y sus datos personales asociados.
   *
   * @param query - Parámetros de consulta:
   *   - `id`: ID único del usuario.
   *
   * @returns `Result.ok(GetUserResultDto)` con los datos mapeados del usuario y la persona.
   * @returns `Result.err('NOT_FOUND')` si el usuario no existe.
   */
  async execute(
    query: GetUserQuery,
  ): Promise<Result<GetUserResultDto, AppError>> {
    const user = await this.userRepository.findById(query.id);
    if (!user) {
      return err('NOT_FOUND');
    }

    const person = await this.personRepository.findById(
      user.idPeople.toString(),
    );
    return ok(UserMapper.toGetUserResult(user, person ?? undefined));
  }
}
