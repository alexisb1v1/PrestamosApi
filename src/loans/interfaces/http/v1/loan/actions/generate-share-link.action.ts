import { Controller, Post, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { encryptLoanId } from '@shared/utils/crypto.utils';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class GenerateShareLinkAction {
  @Post(':loanId/share-link')
  @ApiOperation({
    summary: 'Generate a secure encrypted share link for a loan',
  })
  @ApiParam({ name: 'loanId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Share link generated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(
    @Param('loanId') loanId: string,
  ): Promise<{ shareUrl: string }> {
    const token = encryptLoanId(loanId);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/compartir/${token}`;
    return { shareUrl };
  }
}
