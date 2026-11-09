import { Controller, Patch, Param, Body, Req } from '@nestjs/common';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
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
  @ApiResponse({ status: 403, description: 'Forbidden: El préstamo no pertenece a su empresa.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(
    @Param('loanId') loanId: string,
    @Body() dto: ReassignLoanDto,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    const companyId = req.user?.companyId ? String(req.user.companyId) : undefined;
    const result = await this.commandBus.execute<
      ReassignLoanCommand,
      Result<void, AppError>
    >(new ReassignLoanCommand(loanId, dto.newUserId, companyId));
    return matchResult(result, () => undefined, {
      NOT_FOUND: `Préstamo con ID ${loanId} no encontrado.`,
    });
  }
}
