import {
  Controller,
  Patch,
  Body,
  Req,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Inject,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@users/infrastructure/security/roles.decorator';
import { RolesGuard } from '@users/infrastructure/security/roles.guard';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '@companies/domain/repositories/company.repository';
import { UpdateCompanySettingsRequestDto } from '../dto/update-company-settings.request.dto';
import { Redis } from 'ioredis';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/v1/company')
export class UpdateCompanySettingsAction {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  @Patch('my-company/settings')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({
    summary: 'Actualizar las configuraciones de la empresa (personalización visual, colores, ícono y políticas de crédito)',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'ID de empresa específica (solo aplicable para perfil OWNER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración de la empresa actualizada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  async execute(
    @Body() dto: UpdateCompanySettingsRequestDto,
    @Req() req: any,
    @Query('companyId') overrideCompanyId?: string,
  ): Promise<{ message: string; settings: Record<string, any> }> {
    const isOwner = req.user?.profile === 'OWNER';
    let targetCompanyId = req.user?.companyId;

    if (isOwner && overrideCompanyId) {
      targetCompanyId = overrideCompanyId;
    }

    if (isOwner && (!targetCompanyId || targetCompanyId === '0')) {
      const companies = await this.companyRepository.findAll();
      if (companies.length > 0) {
        targetCompanyId = companies[0].id;
      }
    }

    if (!targetCompanyId) {
      throw new NotFoundException('No se especificó ninguna empresa asociada.');
    }

    const company = await this.companyRepository.findById(String(targetCompanyId));
    if (!company) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    // Validación estricta de peso de ícono (máximo 18 KB)
    if (dto.branding?.iconUrl && dto.branding.iconUrl.startsWith('data:')) {
      const base64Data = dto.branding.iconUrl.substring(
        dto.branding.iconUrl.indexOf(',') + 1,
      );
      const sizeInKb = (base64Data.length * 0.75) / 1024;
      if (sizeInKb > 18.5) {
        throw new BadRequestException(
          `El ícono excede el límite máximo permitido de 18 KB (${sizeInKb.toFixed(1)} KB).`,
        );
      }
    }

    // Merge seguro de configuraciones existentes
    const currentSettings = company.settings || {};
    const updatedSettings = {
      ...currentSettings,
      branding: {
        ...(currentSettings.branding || {}),
        ...(dto.branding || {}),
      },
      loans: {
        ...(currentSettings.loans || {}),
        ...(dto.loans || {}),
      },
      features: {
        ...(currentSettings.features || {}),
        ...(dto.features || {}),
      },
    };

    company.settings = updatedSettings;
    await this.companyRepository.update(company);

    // Invalidad caché en Redis del tenant para forzar sincronización instantánea
    try {
      const redisKey = `neocobros:tenant:auth:${company.id}`;
      await this.redis.del(redisKey);
    } catch {
      // Ignorar fallo transitorio de Redis
    }

    return {
      message: 'Configuraciones de empresa actualizadas exitosamente',
      settings: updatedSettings,
    };
  }
}
