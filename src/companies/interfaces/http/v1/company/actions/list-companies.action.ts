import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListCompaniesQuery } from '@companies/application/queries/v1/list-companies.query';
import { CompanyResponseDto } from '../dto/company.response.dto';
import { CompanyAppDto } from '@companies/application/queries/v1/dto/company-app.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Company')
@ApiBearerAuth()
@Controller('api/v1/company')
export class ListCompaniesAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List all companies' })
  @ApiResponse({
    status: 200,
    description: 'Companies retrieved successfully',
    type: [CompanyResponseDto],
  })
  async execute(): Promise<CompanyResponseDto[]> {
    const result = await this.queryBus.execute<
      ListCompaniesQuery,
      Result<CompanyAppDto[], AppError>
    >(new ListCompaniesQuery());
    return matchResult(result, (companies) =>
      companies.map((c) => new CompanyResponseDto(c)),
    );
  }
}
