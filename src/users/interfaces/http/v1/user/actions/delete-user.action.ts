import { Controller, Delete, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DeleteUserCommand } from '@users/application/commands/v1/delete-user.command';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class DeleteUserAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete (deactivate) user' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async execute(@Param('userId') userId: string) {
    const result = await this.commandBus.execute<
      DeleteUserCommand,
      Result<void, AppError>
    >(new DeleteUserCommand(userId));
    return matchResult(result, () => ({
      success: true,
      message: 'Usuario desactivado correctamente',
    }));
  }
}
