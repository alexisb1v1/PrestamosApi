import { Controller, Patch, Param, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ToggleDayStatusCommand } from '@users/application/commands/v1/toggle-day-status.command';
import { ToggleDayStatusDto } from '../dto/toggle-day-status.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class ToggleDayStatusAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':userId/toggle-day-status')
  @ApiOperation({ summary: 'Toggle user day status' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Day status toggled.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async execute(
    @Param('userId') userId: string,
    @Body() dto: ToggleDayStatusDto,
  ) {
    const result = await this.commandBus.execute<
      ToggleDayStatusCommand,
      Result<void, AppError>
    >(new ToggleDayStatusCommand(userId, dto.isDayClosed));
    return matchResult(result, () => ({
      success: true,
      message: 'Estado del día actualizado correctamente',
    }));
  }
}
