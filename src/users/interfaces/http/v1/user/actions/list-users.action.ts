import { Controller, Get, Query, Req } from '@nestjs/common';
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
    @Req() req: any,
    @Query('username') username?: string,
    @Query('idCompany') idCompany?: number,
  ): Promise<UserResponseDto[]> {
    const isOwner = req.user?.profile === 'OWNER';
    let effectiveCompanyId = idCompany;

    // Aislamiento multi-tenant (OWASP BOLA / API1): No-owners solo ven usuarios de su empresa
    if (!isOwner) {
      effectiveCompanyId = req.user?.companyId ? Number(req.user.companyId) : undefined;
    }

    const result = await this.queryBus.execute<
      ListUsersQuery,
      Result<UserAppDto[], AppError>
    >(new ListUsersQuery(username, effectiveCompanyId));
    return matchResult(result, (users) =>
      users.map((u) => new UserResponseDto(u)),
    );
  }
}
