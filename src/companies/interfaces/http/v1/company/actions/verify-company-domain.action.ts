import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { VerifyCompanyDomainQuery } from '../../../../../application/queries/v1/verify-company-domain.query';
import { Public } from '@users/infrastructure/security/public.decorator';

@ApiTags('Company')
@Controller('api/v1/company')
export class VerifyCompanyDomainAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Public()
  @Get('verify-domain')
  @ApiOperation({ summary: 'Verificar dominio para Caddy' })
  @ApiQuery({ name: 'domain', description: 'Dominio completo a verificar' })
  @ApiResponse({ status: 200, description: 'Dominio válido y activo' })
  @ApiResponse({ status: 404, description: 'Dominio no encontrado o inactivo' })
  async execute(@Query('domain') fullDomain: string, @Res() res: Response) {
    if (!fullDomain) {
      return res.status(HttpStatus.BAD_REQUEST).send();
    }
    const result = await this.queryBus.execute(new VerifyCompanyDomainQuery(fullDomain));
    if (result.isOk()) {
      return res.status(HttpStatus.OK).send();
    }
    return res.status(HttpStatus.NOT_FOUND).send();
  }
}
