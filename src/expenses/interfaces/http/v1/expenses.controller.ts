import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterExpenseCommand } from '../../../application/commands/v1/register-expense.command';
import { ListExpensesQuery } from '../../../application/queries/v1/list-expenses.query';
import { DeleteExpenseCommand } from '../../../application/commands/v1/delete-expense.command';
import { RegisterExpenseRequestDto } from './dto/register-expense.request.dto';
import { ExpenseResponseDto } from './dto/expense.response.dto';
import { Expense } from '../../../domain/entities/expense.entity';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('api/v1/expenses')
export class ExpensesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new expense' })
  @ApiResponse({
    status: 201,
    description: 'Expense registered successfully.',
    type: String,
  })
  async register(@Body() dto: RegisterExpenseRequestDto) {
    const command = new RegisterExpenseCommand(
      dto.description,
      dto.amount,
      dto.userId,
    );
    const id = await this.commandBus.execute<RegisterExpenseCommand, string>(
      command,
    );
    return { id, message: 'Gasto registrado correctamente' };
  }

  @Get()
  @ApiOperation({ summary: 'List expenses with optional filters' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'date', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'List of expenses.',
    type: [ExpenseResponseDto],
  })
  async findAll(
    @Query('userId') userId?: string,
    @Query('date') date?: Date,
  ): Promise<ExpenseResponseDto[]> {
    const query = new ListExpensesQuery(
      userId,
      date ? new Date(date) : undefined,
    );
    const expenses = await this.queryBus.execute<ListExpensesQuery, Expense[]>(
      query,
    );
    return expenses.map((expense) => new ExpenseResponseDto(expense));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (logically) an expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async delete(@Param('id') id: string) {
    const command = new DeleteExpenseCommand(id);
    await this.commandBus.execute(command);
    return { success: true, message: 'Gasto eliminado correctamente' };
  }
}
