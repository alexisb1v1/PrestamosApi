import { Body, Controller, Post, Delete, Param, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { RegisterLoanInstallmentDto } from './dto/register-loan-installment.request.dto';
import { RegisterLoanInstallmentCommand } from '../../../../application/commands/v1/register-loan-installment.command';
import { DeleteLoanInstallmentCommand } from '../../../../application/commands/v1/delete-loan-installment.command';

import { Result } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { matchResult } from '../../../../../common/http/match-result';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans/installments')
export class InstallmentController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Register a new loan installment (payment)' })
  @ApiResponse({ status: 201, description: 'Installment registered successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data or payment outside date range.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async register(@Body() dto: RegisterLoanInstallmentDto): Promise<{ id: string }> {
    const result = await this.commandBus.execute<RegisterLoanInstallmentCommand, Result<string, AppError>>(
      new RegisterLoanInstallmentCommand(dto.loanId, dto.amount, dto.userId, dto.paymentType),
    );
    return matchResult(result, (id) => ({ id }), {
      INVALID_INPUT: 'No se pueden registrar abonos antes de la fecha de inicio del préstamo.',
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a loan installment (physical delete)' })
  @ApiResponse({ status: 204, description: 'Installment deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Installment not found.' })
  async delete(@Param('id') id: string, @Request() req: any): Promise<void> {
    const userId = req.user.sub; 
    const result = await this.commandBus.execute<DeleteLoanInstallmentCommand, Result<void, AppError>>(
      new DeleteLoanInstallmentCommand(id, userId),
    );
    return matchResult(result, () => undefined);
  }
}
