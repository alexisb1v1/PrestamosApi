import { Controller, Patch, Param, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UpdateCompanyStatusCommand } from '@companies/application/commands/v1/update-company-status.command';
import { UpdateCompanyStatusRequestDto } from '../dto/update-company-status.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Company')
@ApiBearerAuth()
@Controller('api/v1/company')
export class UpdateCompanyStatusAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':companyId/status')
  @ApiOperation({ summary: 'Update company status' })
  @ApiParam({ name: 'companyId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Company status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async execute(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyStatusRequestDto,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute<
      UpdateCompanyStatusCommand,
      Result<void, AppError>
    >(new UpdateCompanyStatusCommand(companyId, dto.status));
    return matchResult(result, () => ({
      message: 'Estado de empresa actualizado exitosamente',
    }));
  }
}
