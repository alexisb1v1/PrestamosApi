import { Controller, Patch, Param, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReassignLoanCommand } from '@loans/application/commands/v1/reassign-loan.command';
import { ReassignLoanDto } from '../dto/reassign-loan.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class ReassignLoanAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':loanId/reassign')
  @ApiOperation({ summary: 'Reassign a loan to a different user' })
  @ApiParam({ name: 'loanId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Loan reassigned successfully.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(
    @Param('loanId') loanId: string,
    @Body() dto: ReassignLoanDto,
  ): Promise<void> {
    const result = await this.commandBus.execute<
      ReassignLoanCommand,
      Result<void, AppError>
    >(new ReassignLoanCommand(loanId, dto.newUserId));
    return matchResult(result, () => undefined, {
      NOT_FOUND: `Préstamo con ID ${loanId} no encontrado.`,
    });
  }
}
