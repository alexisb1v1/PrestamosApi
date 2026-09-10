import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListUsersQuery } from '@users/application/queries/v1/list-users.query';
import { UserAppDto } from '@users/application/queries/v1/dto/user-app.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class ListUsersAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'username', required: false })
  @ApiQuery({ name: 'idCompany', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of users.',
    type: [UserResponseDto],
  })
  async execute(
    @Query('username') username?: string,
    @Query('idCompany') idCompany?: number,
  ): Promise<UserResponseDto[]> {
    const result = await this.queryBus.execute<
      ListUsersQuery,
      Result<UserAppDto[], AppError>
    >(new ListUsersQuery(username, idCompany));
    return matchResult(result, (users) =>
      users.map((u) => new UserResponseDto(u)),
    );
  }
}
