import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { GetCompanyPublicInfoQuery } from '../../../../../application/queries/v1/get-company-public-info.query';
import { Public } from '@users/infrastructure/security/public.decorator';

@ApiTags('Company')
@Controller('api/v1/company')
export class GetCompanyPublicInfoAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Public()
  @Get('public-info/:subdomain')
  @ApiOperation({ summary: 'Obtener información pública de la empresa por subdominio' })
  @ApiParam({ name: 'subdomain', description: 'Subdominio de la empresa' })
  @ApiResponse({ status: 200, description: 'Información de la empresa' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada o inactiva' })
  async execute(@Param('subdomain') subdomain: string, @Res() res: Response) {
    if (!subdomain) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Subdomain is required' });
    }
    
    const result = await this.queryBus.execute(new GetCompanyPublicInfoQuery(subdomain));
    
    if (result.isOk()) {
      return res.status(HttpStatus.OK).json(result.value);
    }
    
    return res.status(HttpStatus.NOT_FOUND).json({ message: 'Company not found or inactive' });
  }
}
