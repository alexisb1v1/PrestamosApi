import { Controller, Put, Param, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UpdateCompanyCommand } from '@companies/application/commands/v1/update-company.command';
import { UpdateCompanyRequestDto } from '../dto/update-company.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Company')
@ApiBearerAuth()
@Controller('api/v1/company')
export class UpdateCompanyAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':companyId')
  @ApiOperation({ summary: 'Update company information' })
  @ApiParam({ name: 'companyId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async execute(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyRequestDto,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute<
      UpdateCompanyCommand,
      Result<void, AppError>
    >(new UpdateCompanyCommand(companyId, dto.companyName, dto.subdomain));
    return matchResult(result, () => ({
      message: 'Empresa actualizada exitosamente',
    }));
  }
}
