import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreatePersonCommand } from '@users/application/commands/v1/create-person.command';
import { CreatePersonDto } from '../dto/create-person.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Person')
@ApiBearerAuth()
@Controller('api/v1/person')
export class CreatePersonAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a new person' })
  @ApiResponse({ status: 201, description: 'Person created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Ya existe una persona con ese documento.',
  })
  async execute(@Body() dto: CreatePersonDto): Promise<{ id: string }> {
    const command = new CreatePersonCommand(
      dto.documentType,
      dto.documentNumber,
      dto.firstName,
      dto.lastName,
      dto.birthday ? new Date(dto.birthday) : null,
    );
    const result = await this.commandBus.execute<
      CreatePersonCommand,
      Result<string, AppError>
    >(command);
    return matchResult(result, (id) => ({ id }));
  }
}
