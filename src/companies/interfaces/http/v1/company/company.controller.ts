import { Controller, Post, Get, Put, Patch, Body, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { CreateCompanyCommand } from '../../../../application/commands/v1/create-company.command';
import { UpdateCompanyCommand } from '../../../../application/commands/v1/update-company.command';
import { UpdateCompanyStatusCommand } from '../../../../application/commands/v1/update-company-status.command';
import { ListCompaniesQuery } from '../../../../application/queries/v1/list-companies.query';

import { CreateCompanyRequestDto } from './dto/create-company-request.dto';
import { UpdateCompanyRequestDto } from './dto/update-company-request.dto';
import { UpdateCompanyStatusRequestDto } from './dto/update-company-status-request.dto';
import { CompanyResponseDto } from './dto/company.response.dto';
import { CompanyAppDto } from '../../../../application/queries/v1/dto/company-app.dto';

import { Result } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { matchResult } from '../../../../../common/http/match-result';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class CompanyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully', type: String })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateCompanyRequestDto): Promise<{ id: string }> {
    const result = await this.commandBus.execute<CreateCompanyCommand, Result<string, AppError>>(
      new CreateCompanyCommand(dto.companyName),
    );
    return matchResult(result, (id) => ({ id }));
  }

  @Get()
  @ApiOperation({ summary: 'List all companies' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully', type: [CompanyResponseDto] })
  async findAll(): Promise<CompanyResponseDto[]> {
    const result = await this.queryBus.execute<ListCompaniesQuery, Result<CompanyAppDto[], AppError>>(
      new ListCompaniesQuery(),
    );
    return matchResult(result, (companies) => companies.map((c) => new CompanyResponseDto(c)));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update company information' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyRequestDto): Promise<{ message: string }> {
    const result = await this.commandBus.execute<UpdateCompanyCommand, Result<void, AppError>>(
      new UpdateCompanyCommand(id, dto.companyName),
    );
    return matchResult(result, () => ({ message: 'Empresa actualizada exitosamente' }));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update company status' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Company status updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateCompanyStatusRequestDto): Promise<{ message: string }> {
    const result = await this.commandBus.execute<UpdateCompanyStatusCommand, Result<void, AppError>>(
      new UpdateCompanyStatusCommand(id, dto.status),
    );
    return matchResult(result, () => ({ message: 'Estado de empresa actualizado exitosamente' }));
  }
}
