import {
  Controller,
  Post,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  Req,
  Inject,
} from '@nestjs/common';
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
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '@companies/domain/repositories/company.repository';

export class RecalculateScoreResponseDto {
  creditScore: number;
  creditScoreDetail: ScoreDetailPayload;
}

@ApiTags('Person')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/v1/person')
export class RecalculatePersonScoreAction {
  constructor(
    private readonly creditScoreService: CreditScoreCronService,
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

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
  async execute(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<RecalculateScoreResponseDto> {
    const currentUser = req.user;
    const company =
      req.company ||
      (currentUser?.companyId && currentUser?.keyToken
        ? await this.companyRepository.findByIdAndKeyToken(
            String(currentUser.companyId),
            String(currentUser.keyToken),
          )
        : null);

    if (!company || company.getNormalizedStatus() !== 'ACTIVE') {
      throw new ForbiddenException('Empresa inactiva o no autorizada');
    }

    if (!company.settings?.features?.risk_scoring) {
      throw new ForbiddenException(
        'Su empresa no tiene contratado el servicio de Central de Riesgos',
      );
    }

    try {
      const result =
        await this.creditScoreService.calculateAndSavePersonScore(id);
      return result;
    } catch (err: any) {
      throw new NotFoundException(
        `No se pudo recalcular el score para la persona con ID ${id}`,
      );
    }
  }
}
