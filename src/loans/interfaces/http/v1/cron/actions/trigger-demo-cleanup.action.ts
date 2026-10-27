import { Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@users/infrastructure/security/roles.decorator';
import { RolesGuard } from '@users/infrastructure/security/roles.guard';
import { CreditScoreCronService } from '@loans/application/services/credit-score-cron.service';

export class TriggerDemoCleanupResponseDto {
  success: boolean;
  message: string;
  executionId: string;
  status: string;
  durationMs: number;
  loansDeleted: number;
  installmentsDeleted: number;
  expensesDeleted: number;
  totalProcessed: number;
}

@ApiTags('Owner - Crons')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/v1/owner/cron')
export class TriggerDemoCleanupAction {
  constructor(private readonly creditScoreService: CreditScoreCronService) { }

  @Post('run-demo-cleanup')
  @HttpCode(HttpStatus.OK)
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Ejecutar la purga y limpieza de préstamos y gastos de la empresa Demo (ID 102) a demanda (exclusivo para OWNER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Purga demo ejecutada exitosamente.',
    type: TriggerDemoCleanupResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado. Se requiere perfil OWNER.',
  })
  async execute(): Promise<TriggerDemoCleanupResponseDto> {
    const result = await this.creditScoreService.runDemoCompanyCleanupJob('MANUAL', 102, 7);
    return {
      success: true,
      message: 'Limpieza periódica de cartera y gastos de la empresa Demo ejecutada exitosamente.',
      ...result,
    };
  }
}
