import { Body, Controller, Patch, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReassignLoanDto } from './dto/reassign-loan.request.dto';
import { ReassignLoanCommand } from '../../../../application/commands/v1/reassign-loan.command';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans')
export class ReassignLoanController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/reassign')
  @ApiOperation({ summary: 'Reassign a loan to a different user' })
  @ApiResponse({ status: 200, description: 'Loan reassigned successfully.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async reassign(
    @Param('id') id: string,
    @Body() dto: ReassignLoanDto,
  ): Promise<void> {
    const { newUserId } = dto;
    const command = new ReassignLoanCommand(id, newUserId);
    await this.commandBus.execute(command);
  }
}
