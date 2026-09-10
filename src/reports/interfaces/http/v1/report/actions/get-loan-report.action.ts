import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetLoanReportQuery } from '@reports/application/queries/v1/get-loan-report.query';
import { LoanReportResponseDto } from '../dto/loan-report-response.dto';
import { LoanReportResultDto } from '@reports/application/queries/v1/dto/loan-report-result.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Report')
@ApiBearerAuth()
@Controller('api/v1/report')
export class GetLoanReportAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('loan')
  @ApiOperation({ summary: 'Generar reporte detallado de préstamos' })
  @ApiQuery({ name: 'startDate', type: Date, example: '2024-03-01' })
  @ApiQuery({ name: 'endDate', type: Date, example: '2024-03-31' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiResponse({ status: 200, type: LoanReportResponseDto })
  async execute(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId?: string,
    @Query('userId') userId?: string,
  ): Promise<LoanReportResponseDto> {
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

    const result = await this.queryBus.execute<
      GetLoanReportQuery,
      Result<LoanReportResultDto, AppError>
    >(
      new GetLoanReportQuery(
        new Date(sYear, sMonth - 1, sDay, 0, 0, 0),
        new Date(eYear, eMonth - 1, eDay, 23, 59, 59),
        companyId,
        userId,
      ),
    );
    return matchResult(result, (report) => {
      const response = new LoanReportResponseDto();
      Object.assign(response, report);
      return response;
    });
  }
}
