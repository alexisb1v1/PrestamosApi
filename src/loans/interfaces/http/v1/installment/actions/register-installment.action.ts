import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterLoanInstallmentDto } from '../dto/register-loan-installment.request.dto';
import { RegisterLoanInstallmentCommand } from '@loans/application/commands/v1/register-loan-installment.command';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Installment')
@ApiBearerAuth()
@Controller('api/v1/installment')
export class RegisterInstallmentAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Register a new loan installment (payment)' })
  @ApiResponse({
    status: 201,
    description: 'Installment registered successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or payment outside date range.',
  })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(
    @Body() dto: RegisterLoanInstallmentDto,
  ): Promise<{ id: string }> {
    const result = await this.commandBus.execute<
      RegisterLoanInstallmentCommand,
      Result<string, AppError>
    >(
      new RegisterLoanInstallmentCommand(
        dto.loanId,
        dto.amount,
        dto.userId,
        dto.paymentType,
      ),
    );
    return matchResult(result, (id) => ({ id }));
  }
}
