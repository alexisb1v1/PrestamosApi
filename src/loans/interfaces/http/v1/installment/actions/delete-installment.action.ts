import {
  Controller,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DeleteLoanInstallmentCommand } from '@loans/application/commands/v1/delete-loan-installment.command';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Installment')
@ApiBearerAuth()
@Controller('api/v1/installment')
export class DeleteInstallmentAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':installmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a loan installment (physical delete)' })
  @ApiParam({ name: 'installmentId', type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'Installment deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Installment not found.' })
  async execute(
    @Param('installmentId') installmentId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const userId = req.user.sub;
    const result = await this.commandBus.execute<
      DeleteLoanInstallmentCommand,
      Result<void, AppError>
    >(new DeleteLoanInstallmentCommand(installmentId, userId));
    return matchResult(result, () => undefined);
  }
}
