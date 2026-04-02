import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserQuery } from '../get-user.query';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { User } from '../../../../domain/entities/user.entity';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { Person } from '../../../../domain/entities/person.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { GetUserResultDto } from '../dto/user-app.dto';
import { UserMapper } from '../mappers/user.mapper';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, Result<GetUserResultDto, AppError>> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<Result<GetUserResultDto, AppError>> {
    const user = await this.userRepository.findById(query.id);
    if (!user) {
      return err('NOT_FOUND');
    }

    const person = await this.personRepository.findById(user.idPeople.toString());
    return ok(UserMapper.toGetUserResult(user, person ?? undefined));
  }
}
