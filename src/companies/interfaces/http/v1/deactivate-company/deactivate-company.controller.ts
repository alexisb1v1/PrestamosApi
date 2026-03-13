import { Controller, Patch, Param, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UpdateCompanyStatusCommand } from '../../../../application/commands/v1/update-company-status.command';
import { UpdateCompanyStatusRequestDto } from '../dto/update-company-status-request.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class UpdateCompanyStatusController {
  constructor(private readonly commandBus: CommandBus) { }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update company status' })
  @ApiParam({ name: 'id', type: 'string', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company status updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyStatusRequestDto,
  ): Promise<{ message: string }> {
    const command = new UpdateCompanyStatusCommand(id, dto.status);
    await this.commandBus.execute(command);
    return { message: 'Estado de empresa actualizado exitosamente' };
  }
}
