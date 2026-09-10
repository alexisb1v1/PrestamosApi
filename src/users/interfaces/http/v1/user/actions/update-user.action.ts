import { Controller, Put, Param, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UpdateUserCommand } from '@users/application/commands/v1/update-user.command';
import { UpdateUserDto } from '../dto/update-user.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class UpdateUserAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':userId')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async execute(@Param('userId') userId: string, @Body() dto: UpdateUserDto) {
    const command = new UpdateUserCommand(
      userId,
      dto.profile,
      dto.status,
      dto.documentType,
      dto.documentNumber,
      dto.firstName,
      dto.lastName,
      dto.birthday
        ? new Date(dto.birthday)
        : dto.birthday === null
          ? null
          : undefined,
    );
    const result = await this.commandBus.execute<
      UpdateUserCommand,
      Result<void, AppError>
    >(command);
    return matchResult(result, () => ({
      success: true,
      message: 'Usuario actualizado correctamente',
    }));
  }
}
