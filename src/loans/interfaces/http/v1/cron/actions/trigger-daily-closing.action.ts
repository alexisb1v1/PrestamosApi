import { Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@users/infrastructure/security/roles.decorator';
import { RolesGuard } from '@users/infrastructure/security/roles.guard';
import { CreditScoreCronService } from '@loans/application/services/credit-score-cron.service';

export class TriggerDailyClosingResponseDto {
  success: boolean;
  message: string;
  executionId: string;
  status: string;
  durationMs: number;
  liquidatedProcessed: number;
  activeProcessed: number;
  totalProcessed: number;
}

@ApiTags('Owner - Crons')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/v1/owner/cron')
export class TriggerDailyClosingAction {
  constructor(private readonly creditScoreService: CreditScoreCronService) {}

  @Post('run-daily-closing')
  @HttpCode(HttpStatus.OK)
  @Roles('OWNER')
  @ApiOperation({
    summary: 'Ejecutar el cierre masivo diario de préstamos y mora a demanda (exclusivo para OWNER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cierre masivo ejecutado exitosamente.',
    type: TriggerDailyClosingResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado. Se requiere perfil OWNER.',
  })
  async execute(): Promise<TriggerDailyClosingResponseDto> {
    const result = await this.creditScoreService.runDailyLoansClosingJob('MANUAL');
    return {
      success: true,
      message: 'Cierre diario masivo de cartera y evaluación de mora ejecutado exitosamente.',
      ...result,
    };
  }
}
