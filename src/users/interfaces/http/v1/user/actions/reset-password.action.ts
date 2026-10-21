import { Controller, Patch, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ResetUserPasswordCommand } from '@users/application/commands/v1/reset-user-password.command';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class ResetPasswordAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':userId/reset-password')
  @ApiOperation({ summary: 'Reset user password to person document number' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Person document number not found.' })
  async execute(@Param('userId') userId: string) {
    const result = await this.commandBus.execute<
      ResetUserPasswordCommand,
      Result<void, AppError>
    >(new ResetUserPasswordCommand(userId));

    return matchResult(result, () => ({
      success: true,
      message: 'Contraseña restablecida correctamente al número de documento',
    }));
  }
}
