import { Controller, Get, Request, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetDashboardQuery } from '../../../../application/queries/v1/get-dashboard.query';
import { DashboardAppDto } from '../../../../application/queries/v1/dto/loan-app.dto';
import { DashboardResponseDto } from './dto/dashboard.response.dto';

import { Result } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { matchResult } from '../../../../../common/http/match-result';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans/dashboard')
export class DashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Obtener el resumen del dashboard diario' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  async getDashboard(
    @Request() _req,
    @Query('userId') userId?: string,
    @Query('companyId') companyId?: string,
  ): Promise<DashboardResponseDto> {
    const result = await this.queryBus.execute<GetDashboardQuery, Result<DashboardAppDto, AppError>>(
      new GetDashboardQuery(userId, companyId),
    );
    return matchResult(result, (stats) => new DashboardResponseDto(stats));
  }
}
