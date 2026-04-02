import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FindPersonQuery } from '../../../../application/queries/v1/find-person.query';
import { CreatePersonCommand } from '../../../../application/commands/v1/create-person.command';
import { CreatePersonDto } from './dto/create-person.request.dto';
import { FindPersonResponseDto } from './dto/find-person.response.dto';
import { Person } from '../../../../domain/entities/person.entity';
import { Result } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { matchResult } from '../../../../../common/http/match-result';

@ApiTags('People')
@ApiBearerAuth()
@Controller('api/v1/people')
export class PeopleController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new person' })
  @ApiResponse({ status: 201, description: 'Person created successfully.' })
  @ApiResponse({ status: 400, description: 'Ya existe una persona con ese documento.' })
  async create(@Body() dto: CreatePersonDto): Promise<{ id: string }> {
    const command = new CreatePersonCommand(
      dto.documentType, dto.documentNumber,
      dto.firstName, dto.lastName,
      dto.birthday ? new Date(dto.birthday) : undefined,
    );
    const result = await this.commandBus.execute<CreatePersonCommand, Result<string, AppError>>(command);
    return matchResult(
      result,
      (id) => ({ id }),
      { ALREADY_EXISTS: 'Ya existe una persona registrada con este documento' },
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Find person by document' })
  @ApiQuery({ name: 'documentType', required: true })
  @ApiQuery({ name: 'documentNumber', required: true })
  @ApiResponse({ status: 200, description: 'Person found.', type: FindPersonResponseDto })
  @ApiResponse({ status: 404, description: 'Person not found.' })
  async findByDocument(
    @Query('documentType') documentType: string,
    @Query('documentNumber') documentNumber: string,
  ): Promise<FindPersonResponseDto> {
    const result = await this.queryBus.execute<FindPersonQuery, Result<Person, AppError>>(
      new FindPersonQuery(documentType, documentNumber),
    );
    return matchResult(result, (person) => {
      const birthdayValue = person.birthday;
      let birthdayStr: string | null = null;
      if (birthdayValue) {
        birthdayStr = birthdayValue instanceof Date
          ? birthdayValue.toISOString().substring(0, 10)
          : String(birthdayValue).substring(0, 10);
      }
      return {
        id: person.id ?? '',
        documentType: person.documentType,
        documentNumber: person.documentNumber,
        firstName: person.firstName,
        lastName: person.lastName,
        birthday: birthdayStr,
      };
    });
  }
}
