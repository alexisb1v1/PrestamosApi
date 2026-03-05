import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { GetLoanReportQuery } from '../../../application/queries/v1/get-loan-report.query';
import { LoanReportResponseDto } from './dto/loan-report-response.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('api/v1/reports/loans')
export class GetLoanReportController {
    constructor(private readonly queryBus: QueryBus) { }

    @Get()
    @ApiOperation({ summary: 'Generar reporte detallado de préstamos' })
    @ApiQuery({ name: 'startDate', type: Date, example: '2024-03-01' })
    @ApiQuery({ name: 'endDate', type: Date, example: '2024-03-31' })
    @ApiQuery({ name: 'companyId', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiResponse({ status: 200, type: LoanReportResponseDto })
    async getReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('companyId') companyId?: string,
        @Query('userId') userId?: string,
    ): Promise<LoanReportResponseDto> {
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

        const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

        return await this.queryBus.execute(
            new GetLoanReportQuery(start, end, companyId, userId),
        );
    }
}
