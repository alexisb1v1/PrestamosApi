import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetConsolidatedReportQuery } from '@reports/application/queries/v1/get-consolidated-report.query';
import { GetCollectorReportQuery } from '@reports/application/queries/v1/get-collector-report.query';
import { GetClientHealthReportQuery } from '@reports/application/queries/v1/get-client-health-report.query';

@ApiTags('Report')
@ApiBearerAuth()
@Controller('api/v1/report')
export class GetAdvancedReportsAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('consolidated')
  @ApiOperation({ summary: 'Reporte: Visión General Consolidada' })
  @ApiQuery({ name: 'startDate', type: Date, example: '2024-03-01' })
  @ApiQuery({ name: 'endDate', type: Date, example: '2024-03-31' })
  @ApiQuery({ name: 'companyId', required: false })
  async getConsolidated(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId?: string,
  ) {
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
    
    return this.queryBus.execute(
      new GetConsolidatedReportQuery(
        new Date(sYear, sMonth - 1, sDay, 0, 0, 0),
        new Date(eYear, eMonth - 1, eDay, 23, 59, 59),
        companyId,
      ),
    );
  }

  @Get('collector')
  @ApiOperation({ summary: 'Reporte: Por Cobrador' })
  @ApiQuery({ name: 'startDate', type: Date, example: '2024-03-01' })
  @ApiQuery({ name: 'endDate', type: Date, example: '2024-03-31' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  async getCollectorReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('companyId') companyId?: string,
    @Query('userId') userId?: string,
  ) {
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
    
    return this.queryBus.execute(
      new GetCollectorReportQuery(
        new Date(sYear, sMonth - 1, sDay, 0, 0, 0),
        new Date(eYear, eMonth - 1, eDay, 23, 59, 59),
        companyId,
        userId,
      ),
    );
  }

  @Get('client-health')
  @ApiOperation({ summary: 'Reporte: Historial y Salud Crediticia por Cliente' })
  @ApiQuery({ name: 'personId', required: true })
  async getClientHealth(@Query('personId') personId: string) {
    return this.queryBus.execute(new GetClientHealthReportQuery(personId));
  }
}
