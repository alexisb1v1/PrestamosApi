import { Controller, Get, Param, ForbiddenException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { GetLoanDetailsQuery } from '@loans/application/queries/v1/get-loan-details.query';
import { PublicLoanDetailsResponseDto } from '../dto/public-loan-details.response.dto';
import { LoanAppDto } from '@loans/application/queries/v1/dto/loan-app.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';
import { decryptLoanId } from '@shared/utils/crypto.utils';
import { Public } from '@users/infrastructure/security/public.decorator';

@ApiTags('Loan')
@Public() // Hace que todo el controlador sea público (excluido de jwt-auth.guard)
@Controller('api/v1/loan')
export class GetPublicLoanDetailsAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('public-share/:token')
  @ApiOperation({
    summary: 'Get details of a loan publicly via an encrypted token without login',
  })
  @ApiParam({ name: 'token', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Loan details retrieved successfully.',
    type: PublicLoanDetailsResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Invalid or manipulated token.' })
  async execute(
    @Param('token') token: string,
  ): Promise<PublicLoanDetailsResponseDto> {
    const loanId = decryptLoanId(token);
    
    // Si el descifrado falla (manipulación de datos, clave incorrecta o token inválido)
    // lanzamos ForbiddenException sin dar pistas de la existencia del ID.
    if (!loanId) {
      throw new ForbiddenException('Enlace de préstamo inválido o expirado.');
    }

    const result = await this.queryBus.execute<
      GetLoanDetailsQuery,
      Result<LoanAppDto, AppError>
    >(new GetLoanDetailsQuery(loanId));

    if (result.isErr()) {
      throw new ForbiddenException('Enlace de préstamo inválido o expirado.');
    }

    return new PublicLoanDetailsResponseDto(result.value);
  }
}
