import { Controller, Get, Request, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetDashboardQuery } from '../../../../application/queries/v1/get-dashboard.query';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans/dashboard')
export class GetDashboardController {
    constructor(private readonly queryBus: QueryBus) { }

    @Get()
    @ApiOperation({ summary: 'Obtener el resumen del dashboard diario' })
    @ApiQuery({ name: 'userId', required: false, description: 'Filtrar por ID de usuario' })
    @ApiResponse({ status: 200, type: DashboardResponseDto })
    async getDashboard(@Request() req, @Query('userId') userId?: string): Promise<DashboardResponseDto> {
        const result = await this.queryBus.execute(new GetDashboardQuery(userId));
        return new DashboardResponseDto(result);
    }
}
