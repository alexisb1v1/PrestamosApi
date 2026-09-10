import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DeleteLoanCommand } from '@loans/application/commands/v1/delete-loan.command';
import { Roles } from '@users/infrastructure/security/roles.decorator';
import { RolesGuard } from '@users/infrastructure/security/roles.guard';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class DeleteLoanAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':loanId')
  @Roles('ADMIN', 'OWNER')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Logically delete a loan (sets status to Eliminado)',
  })
  @ApiParam({ name: 'loanId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Loan logically deleted successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only ADMIN or OWNER can delete loans.',
  })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(@Param('loanId') loanId: string): Promise<void> {
    const result = await this.commandBus.execute<
      DeleteLoanCommand,
      Result<void, AppError>
    >(new DeleteLoanCommand(loanId));
    return matchResult(result, () => undefined, {
      NOT_FOUND: `Préstamo con ID ${loanId} no encontrado.`,
    });
  }
}
