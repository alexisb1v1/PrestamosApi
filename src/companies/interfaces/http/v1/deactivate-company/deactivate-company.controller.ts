import { Controller, Patch, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DeactivateCompanyCommand } from '../../../../application/commands/v1/deactivate-company.command';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class DeactivateCompanyController {
    constructor(private readonly commandBus: CommandBus) { }

    @Patch(':id/deactivate')
    @ApiOperation({ summary: 'Deactivate a company' })
    @ApiParam({ name: 'id', type: 'string', description: 'Company ID' })
    @ApiResponse({ status: 200, description: 'Company deactivated successfully' })
    @ApiResponse({ status: 404, description: 'Company not found' })
    async deactivate(@Param('id') id: string): Promise<{ message: string }> {
        const command = new DeactivateCompanyCommand(id);
        await this.commandBus.execute(command);
        return { message: 'Empresa desactivada exitosamente' };
    }
}
