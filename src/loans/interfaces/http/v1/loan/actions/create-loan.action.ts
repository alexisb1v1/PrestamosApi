import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateLoanCommand } from '@loans/application/commands/v1/create-loan.command';
import { CreateLoanDto } from '../dto/create-loan.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class CreateLoanAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Apply for a new loan' })
  @ApiResponse({
    status: 201,
    description: 'Loan application created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Loan already exists or invalid data.',
  })
  async execute(@Body() dto: CreateLoanDto): Promise<void> {
    const result = await this.commandBus.execute<
      CreateLoanCommand,
      Result<void, AppError>
    >(
      new CreateLoanCommand(
        dto.idPeople,
        dto.amount,
        dto.userId,
        dto.address,
        dto.phone,
        dto.days,
        dto.companyId,
      ),
    );
    return matchResult(result, () => undefined);
  }
}
