import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterLoanInstallmentDto } from './dto/register-loan-installment.request.dto';
import { RegisterLoanInstallmentCommand } from '../../../../application/commands/v1/register-loan-installment.command';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans/installments')
export class RegisterLoanInstallmentController {
    constructor(private readonly commandBus: CommandBus) { }

    @Post()
    @ApiOperation({ summary: 'Register a new loan installment (payment)' })
    @ApiResponse({ status: 201, description: 'Installment registered successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 400, description: 'Invalid data.' })
    async register(@Body() dto: RegisterLoanInstallmentDto): Promise<{ id: string }> {
        const { loanId, amount, userId } = dto;
        const command = new RegisterLoanInstallmentCommand(loanId, amount, userId);
        const id = await this.commandBus.execute(command);
        return { id };
    }
}
