import { Controller, Patch, Body, Req } from '@nestjs/common';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateCollectionOrderCommand } from '@users/application/commands/v1/update-collection-order.command';
import { UpdateCollectionOrderDto } from '../dto/update-collection-order.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('User')
@ApiBearerAuth()
@Controller('api/v1/user')
export class UpdateCollectionOrderAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch('collection-order')
  @ApiOperation({ summary: 'Update user collection order' })
  @ApiResponse({ status: 200, description: 'Collection order updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async execute(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateCollectionOrderDto,
  ) {
    const userId = req.user.sub;
    const result = await this.commandBus.execute<
      UpdateCollectionOrderCommand,
      Result<void, AppError>
    >(new UpdateCollectionOrderCommand(userId, dto.collectionOrder));
    return matchResult(result, () => ({
      success: true,
      message: 'Orden de cobro actualizado correctamente',
    }));
  }
}
