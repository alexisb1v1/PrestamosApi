import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserCommand } from '@users/application/commands/v1/create-user.command';
import { CreateUserDto } from '../dto/create-user.request.dto';
import { CreateUserResponseDto } from '../dto/create-user.response.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class CreateUserAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user with person data' })
  @ApiResponse({
    status: 201,
    description: 'User and Person created successfully.',
    type: CreateUserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'El usuario ya existe.' })
  async execute(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const command = new CreateUserCommand(
      dto.username,
      dto.password,
      dto.profile,
      dto.documentType,
      dto.documentNumber,
      dto.firstName,
      dto.lastName,
      dto.birthday ? new Date(dto.birthday) : null,
      dto.idCompany,
    );
    const result = await this.commandBus.execute<
      CreateUserCommand,
      Result<string, AppError>
    >(command);
    return matchResult(
      result,
      (userId) =>
        new CreateUserResponseDto(
          true,
          'User and Person created successfully',
          userId,
        ),
    );
  }
}
