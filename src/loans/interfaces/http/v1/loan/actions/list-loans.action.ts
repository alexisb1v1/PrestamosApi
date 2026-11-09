import { Controller, Get, Query, Req } from '@nestjs/common';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListLoansQuery } from '@loans/application/queries/v1/list-loans.query';
import { LoanResponseDto } from '../dto/loan.response.dto';
import { LoanAppDto } from '@loans/application/queries/v1/dto/loan-app.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class ListLoansAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List all loans with optional filters' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({
    name: 'searchQuery',
    required: false,
    type: String,
    description: 'Búsqueda por DNI o Nombre',
  })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({
    name: 'isLiquidated',
    required: true,
    type: Boolean,
    description: 'Filtrar por liquidados (true) o activos (false)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of loans retrieved successfully.',
    type: [LoanResponseDto],
  })
  async execute(
    @Req() req: RequestWithUser,
    @Query('userId') userId?: number,
    @Query('searchQuery') searchQuery?: string,
    @Query('companyId') queryCompanyId?: number,
    @Query('isLiquidated') isLiquidated?: string,
  ): Promise<LoanResponseDto[]> {
    const isLiquidatedBool = isLiquidated === 'true';
    // 🛡️ CONTROL BOLA / OWASP API1: Forzar el companyId autenticado para usuarios de tenant
    const effectiveCompanyId = req.user?.companyId ? Number(req.user.companyId) : queryCompanyId;
    const result = await this.queryBus.execute<
      ListLoansQuery,
      Result<LoanAppDto[], AppError>
    >(new ListLoansQuery(isLiquidatedBool, userId, searchQuery, effectiveCompanyId));
    return matchResult(result, (loans) =>
      loans.map((loan) => new LoanResponseDto(loan)),
    );
  }
}
