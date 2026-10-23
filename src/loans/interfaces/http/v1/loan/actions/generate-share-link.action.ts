import {
  Controller,
  Post,
  Param,
  NotFoundException,
  Inject,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
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
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '@companies/domain/repositories/company.repository';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class GenerateShareLinkAction {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
  ) {}

  @Post(':loanId/share-link')
  @ApiOperation({
    summary:
      'Generate a secure encrypted share link for a loan with expiration and dynamic SaaS tenant subdomain',
  })
  @ApiParam({ name: 'loanId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Share link generated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async execute(
    @Param('loanId') loanId: string,
    @Req() req: Request,
  ): Promise<{ shareUrl: string; expiresAt: number; token: string }> {
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

    // 1. Obtener el subdominio en memoria desde las cabeceras HTTP (X-Tenant-Subdomain, Origin o Referer)
    let subdomain = this.extractSubdomainFromHeaders(req);

    // 2. Fallback a BD solo si no viene en las cabeceras HTTP
    if (!subdomain && loan.companyId) {
      try {
        const company = await this.companyRepository.findById(loan.companyId);
        if (company?.subdomain) {
          subdomain = company.subdomain.trim();
        }
      } catch (err) {}
    }

    const systemDomain = process.env.SYSTEM_DOMAIN || 'neocobros.com';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    let shareUrl = '';
    if (
      process.env.NODE_ENV === 'development' &&
      (systemDomain === 'localhost' || systemDomain === 'empresa1')
    ) {
      // Entorno de desarrollo local
      const port = process.env.FRONTEND_PORT || '3000';
      shareUrl = subdomain
        ? `http://${subdomain}.localhost:${port}/compartir/${token}`
        : `http://localhost:${port}/compartir/${token}`;
    } else {
      // Producción SaaS Multi-tenant: https://nombreEmpresa.neocobros.com/compartir/token
      const host = subdomain ? `${subdomain}.${systemDomain}` : systemDomain;
      shareUrl = `${protocol}://${host}/compartir/${token}`;
    }

    return { shareUrl, expiresAt, token };
  }

  /**
   * Extrae el subdominio del tenant en memoria a partir de los encabezados de la petición HTTP.
   */
  private extractSubdomainFromHeaders(req: Request): string | null {
    // 1. Cabecera explícita X-Tenant-Subdomain enviada por la PWA
    const customHeader = req.headers['x-tenant-subdomain'];
    if (typeof customHeader === 'string' && customHeader.trim()) {
      return customHeader.trim();
    }

    // 2. Extraer desde Origin o Referer
    const originOrReferer = (req.headers['origin'] || req.headers['referer']) as
      | string
      | undefined;
    if (originOrReferer) {
      try {
        const url = new URL(originOrReferer);
        const hostname = url.hostname;
        const parts = hostname.split('.');

        // Caso local: "empresa.localhost"
        if (hostname.endsWith('.localhost') && parts.length >= 2) {
          return parts[0];
        }

        // Caso producción / SaaS: "empresa.neocobros.com"
        if (
          parts.length >= 3 &&
          parts[0] !== 'www' &&
          parts[0] !== 'api' &&
          parts[0] !== 'central'
        ) {
          return parts[0];
        }
      } catch {}
    }

    return null;
  }
}
