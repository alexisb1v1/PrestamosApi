import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterExpenseCommand } from '../../../../application/commands/v1/register-expense.command';
import { ListExpensesQuery } from '../../../../application/queries/v1/list-expenses.query';
import { DeleteExpenseCommand } from '../../../../application/commands/v1/delete-expense.command';
import { RegisterExpenseRequestDto } from './dto/register-expense.request.dto';
import { ExpenseResponseDto } from './dto/expense.response.dto';
import { ExpenseAppDto } from '../../../../application/queries/v1/dto/expense-app.dto';
import { Result } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { matchResult } from '../../../../../common/http/match-result';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('api/v1/expenses')
export class ExpenseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new expense' })
  @ApiResponse({ status: 201, description: 'Expense registered successfully.', type: String })
  async register(@Body() dto: RegisterExpenseRequestDto) {
    const result = await this.commandBus.execute<RegisterExpenseCommand, Result<string, AppError>>(
      new RegisterExpenseCommand(dto.description, dto.amount, dto.userId),
    );
    return matchResult(result, (id) => ({ id, message: 'Gasto registrado correctamente' }));
  }

  @Get()
  @ApiOperation({ summary: 'List expenses with optional filters' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'date', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'List of expenses.', type: [ExpenseResponseDto] })
  async findAll(
    @Query('userId') userId?: string,
    @Query('date') date?: Date,
  ): Promise<ExpenseResponseDto[]> {
    const result = await this.queryBus.execute<ListExpensesQuery, Result<ExpenseAppDto[], AppError>>(
      new ListExpensesQuery(userId, date ? new Date(date) : undefined),
    );
    return matchResult(result, (expenses) => expenses.map((e) => new ExpenseResponseDto(e)));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (logically) an expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async delete(@Param('id') id: string) {
    const result = await this.commandBus.execute<DeleteExpenseCommand, Result<void, AppError>>(
      new DeleteExpenseCommand(id),
    );
    return matchResult(result, () => ({ success: true, message: 'Gasto eliminado correctamente' }));
  }
}
