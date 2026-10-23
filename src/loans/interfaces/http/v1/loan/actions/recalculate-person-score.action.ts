import { Controller, Post, Param, UseGuards, NotFoundException } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RolesGuard } from '@users/infrastructure/security/roles.guard';
import {
  CreditScoreCronService,
  ScoreDetailPayload,
} from '@loans/application/services/credit-score-cron.service';

export class RecalculateScoreResponseDto {
  creditScore: number;
  creditScoreDetail: ScoreDetailPayload;
}

@ApiTags('Person')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/v1/person')
export class RecalculatePersonScoreAction {
  constructor(private readonly creditScoreService: CreditScoreCronService) {}

  @Post(':id/recalculate-score')
  @ApiOperation({
    summary: 'Recalcular a demanda el score crediticio y los 3 pilares de una persona',
  })
  @ApiParam({ name: 'id', description: 'ID de la persona' })
  @ApiResponse({
    status: 200,
    description: 'Score recalculado con éxito.',
    type: RecalculateScoreResponseDto,
  })
  async execute(@Param('id') id: string): Promise<RecalculateScoreResponseDto> {
    try {
      const result = await this.creditScoreService.calculateAndSavePersonScore(id);
      return result;
    } catch (err: any) {
      throw new NotFoundException(
        `No se pudo recalcular el score para la persona con ID ${id}`,
      );
    }
  }
}
