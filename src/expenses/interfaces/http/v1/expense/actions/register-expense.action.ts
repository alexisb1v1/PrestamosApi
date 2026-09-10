import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterExpenseCommand } from '@expenses/application/commands/v1/register-expense.command';
import { RegisterExpenseRequestDto } from '../dto/register-expense.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Expense')
@ApiBearerAuth()
@Controller('api/v1/expense')
export class RegisterExpenseAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Register a new expense' })
  @ApiResponse({
    status: 201,
    description: 'Expense registered successfully.',
    type: String,
  })
  async execute(@Body() dto: RegisterExpenseRequestDto) {
    const result = await this.commandBus.execute<
      RegisterExpenseCommand,
      Result<string, AppError>
    >(new RegisterExpenseCommand(dto.description, dto.amount, dto.userId));
    return matchResult(result, (id) => ({
      id,
      message: 'Gasto registrado correctamente',
    }));
  }
}
