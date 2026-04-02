import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListUsersQuery } from '../../../../application/queries/v1/list-users.query';
import { GetUserQuery } from '../../../../application/queries/v1/get-user.query';
import { UserAppDto, GetUserResultDto } from '../../../../application/queries/v1/dto/user-app.dto';
import { CreateUserCommand } from '../../../../application/commands/v1/create-user.command';
import { UpdateUserCommand } from '../../../../application/commands/v1/update-user.command';
import { DeleteUserCommand } from '../../../../application/commands/v1/delete-user.command';
import { ToggleDayStatusCommand } from '../../../../application/commands/v1/toggle-day-status.command';
import { UpdateCollectionOrderCommand } from '../../../../application/commands/v1/update-collection-order.command';
import { CreateUserDto } from './dto/create-user.request.dto';
import { CreateUserResponseDto } from './dto/create-user.response.dto';
import { UpdateUserDto } from './dto/update-user.request.dto';
import { ToggleDayStatusDto } from './dto/toggle-day-status.request.dto';
import { UpdateCollectionOrderDto } from './dto/update-collection-order.request.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { Result } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { matchResult } from '../../../../../common/http/match-result';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new user with person data' })
  @ApiResponse({ status: 201, description: 'User and Person created successfully.', type: CreateUserResponseDto })
  @ApiResponse({ status: 400, description: 'El usuario ya existe.' })
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const command = new CreateUserCommand(
      dto.username, dto.password, dto.profile,
      dto.documentType, dto.documentNumber,
      dto.firstName, dto.lastName,
      new Date(dto.birthday), dto.idCompany,
    );
    const result = await this.commandBus.execute<CreateUserCommand, Result<string, AppError>>(command);
    return matchResult(
      result,
      (userId) => new CreateUserResponseDto(true, 'User and Person created successfully', userId),
      { ALREADY_EXISTS: 'El usuario ya existe' },
    );
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'username', required: false })
  @ApiQuery({ name: 'idCompany', required: false })
  @ApiResponse({ status: 200, description: 'List of users.', type: [UserResponseDto] })
  async findAll(
    @Query('username') username?: string,
    @Query('idCompany') idCompany?: number,
  ): Promise<UserResponseDto[]> {
    const result = await this.queryBus.execute<ListUsersQuery, Result<UserAppDto[], AppError>>(
      new ListUsersQuery(username, idCompany),
    );
    return matchResult(result, (users) => users.map((u) => new UserResponseDto(u)));
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string) {
    const result = await this.queryBus.execute<GetUserQuery, Result<GetUserResultDto, AppError>>(
      new GetUserQuery(id),
    );
    return matchResult(result, ({ user, person }) => ({
      success: true,
      message: 'User found',
      user: new UserResponseDto(user),
      person,
    }));
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const command = new UpdateUserCommand(
      id, dto.profile, dto.status,
      dto.documentType, dto.documentNumber,
      dto.firstName, dto.lastName,
      dto.birthday ? new Date(dto.birthday) : undefined,
    );
    const result = await this.commandBus.execute<UpdateUserCommand, Result<void, AppError>>(command);
    return matchResult(result, () => ({ success: true, message: 'Usuario actualizado correctamente' }));
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (deactivate) user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async delete(@Param('id') id: string) {
    const result = await this.commandBus.execute<DeleteUserCommand, Result<void, AppError>>(
      new DeleteUserCommand(id),
    );
    return matchResult(result, () => ({ success: true, message: 'Usuario desactivado correctamente' }));
  }

  // ─── TOGGLE DAY STATUS ────────────────────────────────────────────────────

  @Patch(':id/toggle-day-status')
  @ApiOperation({ summary: 'Toggle user day status' })
  @ApiResponse({ status: 200, description: 'Day status toggled.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async toggleDayStatus(@Param('id') id: string, @Body() dto: ToggleDayStatusDto) {
    const result = await this.commandBus.execute<ToggleDayStatusCommand, Result<void, AppError>>(
      new ToggleDayStatusCommand(id, dto.isDayClosed),
    );
    return matchResult(result, () => ({ success: true, message: 'Estado del día actualizado correctamente' }));
  }

  // ─── COLLECTION ORDER ─────────────────────────────────────────────────────

  @Patch('collection-order')
  @ApiOperation({ summary: 'Update user collection order' })
  @ApiResponse({ status: 200, description: 'Collection order updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateCollectionOrder(@Req() req: any, @Body() dto: UpdateCollectionOrderDto) {
    const userId = req.user.sub;
    const result = await this.commandBus.execute<UpdateCollectionOrderCommand, Result<void, AppError>>(
      new UpdateCollectionOrderCommand(userId, dto.collectionOrder),
    );
    return matchResult(result, () => ({ success: true, message: 'Orden de cobro actualizado correctamente' }));
  }
}
