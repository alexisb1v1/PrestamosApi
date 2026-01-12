import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ListLoansQuery } from '../../../../application/queries/v1/list-loans.query';
import { LoanResponseDto } from '../dto/loan-response.dto';
import { Loan } from '../../../../domain/entities/loan.entity';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans')
export class ListLoansController {
    constructor(private readonly queryBus: QueryBus) { }

    @Get()
    @ApiOperation({ summary: 'List all loans with optional filters' })
    @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter by collector user ID' })
    @ApiQuery({ name: 'documentNumber', required: false, type: String, description: 'Filter by client document number' })
    @ApiResponse({ status: 200, description: 'List of loans retrieved successfully.', type: [LoanResponseDto] })
    async findAll(
        @Query('userId') userId?: number,
        @Query('documentNumber') documentNumber?: string,
    ): Promise<LoanResponseDto[]> {
        const query = new ListLoansQuery(userId, documentNumber);
        const loans: Loan[] = await this.queryBus.execute(query);
        return loans.map(loan => new LoanResponseDto(loan));
    }
}
