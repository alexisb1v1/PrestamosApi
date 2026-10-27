import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '@users/infrastructure/security/roles.decorator';
import { RolesGuard } from '@users/infrastructure/security/roles.guard';
import { CreditScoreCronService } from '@loans/application/services/credit-score-cron.service';

export class CronExecutionItemDto {
  id: string;
  jobName: string;
  triggerType: 'SCHEDULED' | 'MANUAL';
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  liquidatedProcessed: number;
  activeProcessed: number;
  totalProcessed: number;
  errorMessage?: string;
  details?: Record<string, any>;
}

@ApiTags('Owner - Crons')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/v1/owner/cron')
export class GetCronExecutionsAction {
  constructor(private readonly creditScoreService: CreditScoreCronService) {}

  @Get('executions')
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Listar historial de ejecuciones de crons del sistema (exclusivo para OWNER)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de registros (default 30)' })
  @ApiResponse({
    status: 200,
    description: 'Historial de ejecuciones obtenido exitosamente.',
    type: [CronExecutionItemDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado. Se requiere perfil OWNER.',
  })
  async execute(@Query('limit') limitStr?: string): Promise<CronExecutionItemDto[]> {
    const limit = limitStr ? parseInt(limitStr, 10) : 30;
    const executions = await this.creditScoreService.getCronExecutions(isNaN(limit) ? 30 : limit);
    return executions;
  }
}
