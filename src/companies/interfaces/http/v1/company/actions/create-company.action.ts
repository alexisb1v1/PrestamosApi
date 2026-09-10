import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateCompanyCommand } from '@companies/application/commands/v1/create-company.command';
import { CreateCompanyRequestDto } from '../dto/create-company.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Company')
@ApiBearerAuth()
@Controller('api/v1/company')
export class CreateCompanyAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    type: String,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async execute(@Body() dto: CreateCompanyRequestDto): Promise<{ id: string }> {
    const result = await this.commandBus.execute<
      CreateCompanyCommand,
      Result<string, AppError>
    >(new CreateCompanyCommand(dto.companyName, dto.subdomain));
    return matchResult(result, (id) => ({ id }));
  }
}
