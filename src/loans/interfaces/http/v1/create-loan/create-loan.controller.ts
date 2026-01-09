import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateLoanDto } from './dto/create-loan.request.dto';
import { CreateLoanResponseDto } from './dto/create-loan.response.dto';
import { CreateLoanCommand } from '../../../../application/commands/v1/create-loan.command';

@ApiTags('Loans')
@Controller('api/v1/loans')
export class CreateLoanController {
    constructor(private readonly commandBus: CommandBus) { }

    @Post()
    @ApiOperation({ summary: 'Apply for a new loan' })
    @ApiResponse({ status: 201, description: 'Loan application created successfully.' })
    async create(@Body() createLoanDto: CreateLoanDto): Promise<void> {
        const { idPeople, startDate, endDate, amount, interest, fee, userId } = createLoanDto;

        // Convert strings to Dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        const command = new CreateLoanCommand(idPeople, start, end, amount, interest, fee, userId);

        await this.commandBus.execute(command);
    }
}
