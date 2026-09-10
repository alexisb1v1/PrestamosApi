import { Controller, Patch, Param, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UpdateLoanInfoCommand } from '@loans/application/commands/v1/update-loan-info.command';
import { UpdateLoanInfoDto } from '../dto/update-loan-info.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class UpdateLoanInfoAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':loanId/info')
  @ApiOperation({
    summary:
      'Update the contact information (phone and address) of a loan borrower',
  })
  @ApiParam({ name: 'loanId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Loan information updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(
    @Param('loanId') loanId: string,
    @Body() dto: UpdateLoanInfoDto,
  ): Promise<void> {
    const result = await this.commandBus.execute<
      UpdateLoanInfoCommand,
      Result<void, AppError>
    >(new UpdateLoanInfoCommand(loanId, dto.phone, dto.address));
    return matchResult(result, () => undefined, {
      NOT_FOUND: `Préstamo con ID ${loanId} no encontrado.`,
    });
  }
}
