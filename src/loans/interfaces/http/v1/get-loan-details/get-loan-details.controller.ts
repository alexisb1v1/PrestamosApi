import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetLoanDetailsQuery } from '../../../../application/queries/v1/get-loan-details.query';
import { LoanDetailsResponseDto } from '../dto/loan-details-response.dto';
import { Loan } from '../../../../domain/entities/loan.entity';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans')
export class GetLoanDetailsController {
    constructor(private readonly queryBus: QueryBus) { }

    @Get(':id/details')
    @ApiOperation({ summary: 'Get detailed information of a loan including its installments' })
    @ApiResponse({ status: 200, description: 'Loan details retrieved successfully.', type: LoanDetailsResponseDto })
    @ApiResponse({ status: 404, description: 'Loan not found.' })
    async getDetails(@Param('id') id: string): Promise<LoanDetailsResponseDto> {
        const query = new GetLoanDetailsQuery(id);
        const loan = await this.queryBus.execute<GetLoanDetailsQuery, Loan>(query);
        return new LoanDetailsResponseDto(loan);
    }
}
