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
import { LoanAppDto } from '@loans/application/queries/v1/dto/loan-app.dto';
import { LoanMapper } from '@loans/application/queries/v1/mappers/loan.mapper';
import { Loan } from '@loans/domain/entities/loan.entity';

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
  async execute(@Body() dto: CreateLoanDto): Promise<LoanAppDto> {
    const result = await this.commandBus.execute<
      CreateLoanCommand,
      Result<Loan, AppError>
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
    return matchResult(result, (loan) => LoanMapper.toLoanAppDto(loan));
  }
}
