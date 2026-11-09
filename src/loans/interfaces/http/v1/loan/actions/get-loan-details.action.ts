import { Controller, Get, Param, Req } from '@nestjs/common';
import { RequestWithUser } from '@shared/interfaces/request-with-user.interface';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GetLoanDetailsQuery } from '@loans/application/queries/v1/get-loan-details.query';
import { LoanDetailsResponseDto } from '../dto/loan-details.response.dto';
import { LoanAppDto } from '@loans/application/queries/v1/dto/loan-app.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class GetLoanDetailsAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':loanId/details')
  @ApiOperation({
    summary: 'Get detailed information of a loan including its installments',
  })
  @ApiParam({ name: 'loanId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Loan details retrieved successfully.',
    type: LoanDetailsResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden: El préstamo no pertenece a su empresa.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(
    @Param('loanId') loanId: string,
    @Req() req: RequestWithUser,
  ): Promise<LoanDetailsResponseDto> {
    const companyId = req.user?.companyId ? String(req.user.companyId) : undefined;
    const result = await this.queryBus.execute<
      GetLoanDetailsQuery,
      Result<LoanAppDto, AppError>
    >(new GetLoanDetailsQuery(loanId, companyId));
    return matchResult(result, (loan) => new LoanDetailsResponseDto(loan));
  }
}
