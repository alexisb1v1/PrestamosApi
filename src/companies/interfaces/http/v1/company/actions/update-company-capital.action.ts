import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '@users/infrastructure/security/roles.decorator';
import { RolesGuard } from '@users/infrastructure/security/roles.guard';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '@companies/domain/repositories/company.repository';
import { UpdateCompanyCapitalRequestDto } from '../dto/update-company-capital.request.dto';
import { Redis } from 'ioredis';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('api/v1/company')
export class UpdateCompanyCapitalAction {
  constructor(
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  @Post('my-company/capital')
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Registrar el capital inicial o inyectar nuevo capital a la empresa (Solo perfil ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Capital e historial de inversión actualizados exitosamente.',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado. Solo administradores de la empresa pueden declarar o alterar capital.',
  })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  async execute(
    @Body() dto: UpdateCompanyCapitalRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<{
    message: string;
    initialCapital: number;
    currentCapital: number;
    history: any[];
  }> {
    const targetCompanyId = req.user?.companyId;
    if (!targetCompanyId) {
      throw new NotFoundException('No se encontró ninguna empresa asociada a este usuario.');
    }

    const company = await this.companyRepository.findById(String(targetCompanyId));
    if (!company) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const username = req.user?.username || 'ADMIN';
    const currentSettings = company.settings || {};
    const financialSettings = currentSettings.financial || {};
    const existingHistory: any[] = Array.isArray(financialSettings.capital_history)
      ? financialSettings.capital_history
      : [];

    const isInitialSetup =
      company.initialCapital === null || company.initialCapital === undefined;

    const previousCapital = Number(
      financialSettings.current_capital ?? company.initialCapital ?? 0,
    );
    const newCapital = Number(dto.amount);
    const amountInjected = isInitialSetup
      ? newCapital
      : Number((newCapital - previousCapital).toFixed(2));

    const newHistoryEntry = {
      id: existingHistory.length + 1,
      date: new Date().toISOString(),
      previous_capital: previousCapital,
      amount_injected: amountInjected,
      new_capital: newCapital,
      type: isInitialSetup ? 'INITIAL_CAPITAL' : 'CAPITAL_INJECTION',
      registered_by: username,
      note:
        dto.note ||
        (isInitialSetup
          ? 'Declaración de capital inicial de operaciones'
          : 'Ajuste / Inyección de capital de trabajo'),
    };

    const updatedHistory = [...existingHistory, newHistoryEntry];

    // Actualizar settings y columna física
    company.initialCapital = isInitialSetup ? newCapital : (company.initialCapital ?? newCapital);
    company.settings = {
      ...currentSettings,
      financial: {
        ...financialSettings,
        current_capital: newCapital,
        capital_history: updatedHistory,
      },
    };

    await this.companyRepository.update(company);

    // Invalidad caché en Redis del tenant
    try {
      const redisKey = `neocobros:tenant:auth:${company.id}`;
      await this.redis.del(redisKey);
    } catch {}

    return {
      message: isInitialSetup
        ? 'Capital inicial declarado exitosamente. Operaciones habilitadas.'
        : 'Inyección de capital registrada exitosamente.',
      initialCapital: Number(company.initialCapital),
      currentCapital: newCapital,
      history: updatedHistory,
    };
  }
}

