import { Controller, Delete, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DeleteExpenseCommand } from '@expenses/application/commands/v1/delete-expense.command';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Expense')
@ApiBearerAuth()
@Controller('api/v1/expense')
export class DeleteExpenseAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':expenseId')
  @ApiOperation({ summary: 'Delete (logically) an expense' })
  @ApiParam({ name: 'expenseId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async execute(@Param('expenseId') expenseId: string) {
    const result = await this.commandBus.execute<
      DeleteExpenseCommand,
      Result<void, AppError>
    >(new DeleteExpenseCommand(expenseId));
    return matchResult(result, () => ({
      success: true,
      message: 'Gasto eliminado correctamente',
    }));
  }
}
