import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Req,
  Inject,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FindPersonQuery } from '@users/application/queries/v1/find-person.query';
import { FindPersonResponseDto } from '../dto/find-person.response.dto';
import { Person } from '@users/domain/entities/person.entity';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '@companies/domain/repositories/company.repository';

@ApiTags('Person')
@ApiBearerAuth()
@Controller('api/v1/person')
export class FindPersonAction {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Find person by document' })
  @ApiQuery({ name: 'documentType', required: true })
  @ApiQuery({ name: 'documentNumber', required: true })
  @ApiResponse({
    status: 200,
    description: 'Person found.',
    type: FindPersonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Person not found.' })
  async execute(
    @Query('documentType') documentType: string,
    @Query('documentNumber') documentNumber: string,
    @Req() req: any,
  ): Promise<FindPersonResponseDto> {
    if (
      (documentType === 'DNI' || documentType === '1') &&
      !/^\d{8}$/.test(documentNumber)
    ) {
      throw new BadRequestException(
        'El DNI debe tener exactamente 8 dígitos numéricos.',
      );
    }

    // Validación de Tenant y Server-Side Feature Gating (pre-validada por JwtAuthGuard)
    const currentUser = req.user;
    const company =
      req.company ||
      (currentUser?.companyId && currentUser?.keyToken
        ? await this.companyRepository.findByIdAndKeyToken(
            String(currentUser.companyId),
            String(currentUser.keyToken),
          )
        : null);

    const riskScoringEnabled = !!(
      company &&
      company.getNormalizedStatus() === 'ACTIVE' &&
      company.settings?.features?.risk_scoring
    );

    const result = await this.queryBus.execute<
      FindPersonQuery,
      Result<Person, AppError>
    >(new FindPersonQuery(documentType, documentNumber));

    return matchResult(result, (person) => {
      const birthdayValue = person.birthday;
      let birthdayStr: string | null = null;
      if (birthdayValue) {
        birthdayStr =
          birthdayValue instanceof Date
            ? birthdayValue.toISOString().substring(0, 10)
            : String(birthdayValue).substring(0, 10);
      }

      return {
        id: person.id ?? '',
        documentType: person.documentType,
        documentNumber: person.documentNumber,
        firstName: person.firstName,
        lastName: person.lastName,
        birthday: birthdayStr,
        phone: person.phone,
        address: person.address,
        riskScoringEnabled,
        // Solo expone datos de Central de Riesgos si el tenant tiene activo el servicio
        creditScore: riskScoringEnabled ? person.creditScore : undefined,
        creditScoreDetail: riskScoringEnabled
          ? person.creditScoreDetail
          : undefined,
        suggestedLimit: null, // Queda en NULL según especificación
      };
    });
  }
}
