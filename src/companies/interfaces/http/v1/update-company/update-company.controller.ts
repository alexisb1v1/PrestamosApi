import { Controller, Put, Body, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UpdateCompanyCommand } from '../../../../application/commands/v1/update-company.command';
import { UpdateCompanyRequestDto } from '../dto/update-company-request.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class UpdateCompanyController {
    constructor(private readonly commandBus: CommandBus) { }

    @Put(':id')
    @ApiOperation({ summary: 'Update company information' })
    @ApiParam({ name: 'id', type: 'string', description: 'Company ID' })
    @ApiResponse({ status: 200, description: 'Company updated successfully' })
    @ApiResponse({ status: 404, description: 'Company not found' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCompanyRequestDto
    ): Promise<{ message: string }> {
        const command = new UpdateCompanyCommand(id, dto.companyName);
        await this.commandBus.execute(command);
        return { message: 'Empresa actualizada exitosamente' };
    }
}
