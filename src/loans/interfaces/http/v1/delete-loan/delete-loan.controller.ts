import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DeleteLoanCommand } from '../../../../application/commands/v1/delete-loan.command';
import { Roles } from '../../../../../users/infrastructure/security/roles.decorator';
import { RolesGuard } from '../../../../../users/infrastructure/security/roles.guard';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans')
export class DeleteLoanController {
    constructor(private readonly commandBus: CommandBus) { }

    @Delete(':id')
    @Roles('ADMIN', 'OWNER')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Logically delete a loan (sets status to Eliminado)' })
    @ApiResponse({ status: 200, description: 'Loan logically deleted successfully.' })
    @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN or OWNER can delete loans.' })
    @ApiResponse({ status: 404, description: 'Loan not found.' })
    async delete(@Param('id') id: string): Promise<void> {
        const command = new DeleteLoanCommand(id);
        await this.commandBus.execute(command);
    }
}
