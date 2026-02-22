import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateCompanyCommand } from '../../../../application/commands/v1/create-company.command';
import { CreateCompanyRequestDto } from '../dto/create-company-request.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class CreateCompanyController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    type: String,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateCompanyRequestDto): Promise<{ id: string }> {
    const command = new CreateCompanyCommand(dto.companyName);
    const id = await this.commandBus.execute<CreateCompanyCommand, string>(
      command,
    );
    return { id };
  }
}
