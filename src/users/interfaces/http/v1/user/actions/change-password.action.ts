import { Controller, Put, Body, Req } from '@nestjs/common';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChangePasswordCommand } from '@users/application/commands/v1/change-password.command';
import { ChangePasswordDto } from '../dto/change-password.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class ChangePasswordAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Put('change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid current password.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async execute(
    @Req() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user.sub;
    const result = await this.commandBus.execute<
      ChangePasswordCommand,
      Result<void, AppError>
    >(new ChangePasswordCommand(userId, dto.currentPassword, dto.newPassword));

    return matchResult(result, () => ({
      success: true,
      message: 'Contraseña actualizada correctamente',
    }));
  }
}
