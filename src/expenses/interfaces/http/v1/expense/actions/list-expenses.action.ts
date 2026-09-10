import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListExpensesQuery } from '@expenses/application/queries/v1/list-expenses.query';
import { ExpenseResponseDto } from '../dto/expense.response.dto';
import { ExpenseAppDto } from '@expenses/application/queries/v1/dto/expense-app.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Expense')
@ApiBearerAuth()
@Controller('api/v1/expense')
export class ListExpensesAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List expenses with optional filters' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'date', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'List of expenses.',
    type: [ExpenseResponseDto],
  })
  async execute(
    @Query('userId') userId?: string,
    @Query('date') date?: Date,
  ): Promise<ExpenseResponseDto[]> {
    const result = await this.queryBus.execute<
      ListExpensesQuery,
      Result<ExpenseAppDto[], AppError>
    >(new ListExpensesQuery(userId, date ? new Date(date) : undefined));
    return matchResult(result, (expenses) =>
      expenses.map((e) => new ExpenseResponseDto(e)),
    );
  }
}
