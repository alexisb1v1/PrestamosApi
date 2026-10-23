import { Controller, Post, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RefreshCompanyKeyTokenCommand } from '@companies/application/commands/v1/refresh-company-key-token.command';
import { RefreshCompanyKeyTokenResult } from '@companies/application/commands/v1/handlers/refresh-company-key-token.handler';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Company')
@ApiBearerAuth()
@Controller('api/v1/company')
export class RefreshCompanyKeyTokenAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':companyId/refresh-key-token')
  @ApiOperation({
    summary: 'Regenerar key_token del tenant y forzar cierre masivo de sesiones activas (Kill-Switch)',
    description:
      'Genera una nueva llave secreta para la empresa en PostgreSQL e invalida su caché de autenticación en Redis. Todas las peticiones subsiguientes de cobradores y administradores de esta empresa serán rechazadas con 401 Unauthorized.',
  })
  @ApiParam({ name: 'companyId', type: 'string', description: 'ID de la empresa' })
  @ApiResponse({
    status: 200,
    description: 'Llave de seguridad regenerada y sesiones invalidadas correctamente',
  })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async execute(
    @Param('companyId') companyId: string,
  ): Promise<{ message: string; companyId: string; newKeyToken: string }> {
    const result = await this.commandBus.execute<
      RefreshCompanyKeyTokenCommand,
      Result<RefreshCompanyKeyTokenResult, AppError>
    >(new RefreshCompanyKeyTokenCommand(companyId));

    return matchResult(result, (data) => ({
      message:
        'Llave de seguridad regenerada exitosamente. Todas las sesiones activas han sido cerradas.',
      companyId: data.companyId,
      newKeyToken: data.newKeyToken,
    }));
  }
}
