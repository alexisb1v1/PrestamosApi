import {
  Controller,
  Get,
  Req,
  UseGuards,
  NotFoundException,
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
import { CompanyResponseDto } from '../dto/company.response.dto';
import { CompanyMapper } from '@companies/application/queries/v1/mappers/company.mapper';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/v1/company')
export class GetMyCompanyAction {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  @Get('my-company')
  @Roles('ADMIN', 'OWNER', 'COBRADOR')
  @ApiOperation({
    summary: 'Obtener los datos y configuraciones de la empresa del usuario autenticado',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'ID de empresa específica (solo aplicable para perfil OWNER)',
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa obtenida exitosamente.',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  async execute(
    @Req() req: any,
    @Query('companyId') overrideCompanyId?: string,
  ): Promise<CompanyResponseDto> {
    const isOwner = req.user?.profile === 'OWNER';
    let targetCompanyId = req.user?.companyId;

    if (isOwner && overrideCompanyId) {
      targetCompanyId = overrideCompanyId;
    }

    // Si es OWNER y no tiene targetCompanyId (o es 0), buscar la primera empresa activa
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

    return new CompanyResponseDto(CompanyMapper.toAppDto(company));
  }
}
