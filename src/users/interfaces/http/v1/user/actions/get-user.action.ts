import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GetUserQuery } from '@users/application/queries/v1/get-user.query';
import { GetUserResultDto } from '@users/application/queries/v1/dto/user-app.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class GetUserAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async execute(@Param('userId') userId: string) {
    const result = await this.queryBus.execute<
      GetUserQuery,
      Result<GetUserResultDto, AppError>
    >(new GetUserQuery(userId));
    return matchResult(result, ({ user, person }) => ({
      success: true,
      message: 'User found',
      user: new UserResponseDto(user),
      person,
    }));
  }
}
