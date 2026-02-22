import {
  Controller,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DeleteLoanInstallmentCommand } from '../../../../application/commands/v1/delete-loan-installment.command';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans/installments')
export class DeleteLoanInstallmentController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a loan installment (physical delete)' })
  @ApiResponse({
    status: 204,
    description: 'Installment deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async delete(@Param('id') id: string): Promise<void> {
    // TODO: Get userId from request if needed for auditing or permission check.
    // For now, passing a placeholder or extracting from request if we had the decorator.
    // Assuming public access or simple auth for now as per minimal context.
    // Ideally we use @User() decorator if available.
    const userId = 'admin'; // Placeholder or extract from JWT

    const command = new DeleteLoanInstallmentCommand(id, userId);
    await this.commandBus.execute(command);
  }
}
