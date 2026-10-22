import { Controller, Post, Param, NotFoundException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { encryptLoanId } from '@shared/utils/crypto.utils';
import { GetLoanDetailsQuery } from '@loans/application/queries/v1/get-loan-details.query';
import { LoanAppDto } from '@loans/application/queries/v1/dto/loan-app.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class GenerateShareLinkAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Post(':loanId/share-link')
  @ApiOperation({
    summary: 'Generate a secure encrypted share link for a loan with expiration',
  })
  @ApiParam({ name: 'loanId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Share link generated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(
    @Param('loanId') loanId: string,
  ): Promise<{ shareUrl: string; expiresAt: number }> {
    const result = await this.queryBus.execute<
      GetLoanDetailsQuery,
      Result<LoanAppDto, AppError>
    >(new GetLoanDetailsQuery(loanId));

    if (result.isErr()) {
      throw new NotFoundException('Préstamo no encontrado.');
    }

    const loan = result.value;

    // Calculamos la expiración: fecha fin del préstamo + 15 días, o al menos 30 días desde hoy
    const loanEndTimestamp = loan.endDate
      ? new Date(loan.endDate).getTime() + 15 * 24 * 60 * 60 * 1000
      : 0;
    const minExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const expiresAt = Math.max(loanEndTimestamp, minExpiration);

    const token = encryptLoanId(loanId, expiresAt);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/compartir/${token}`;

    return { shareUrl, expiresAt };
  }
}
