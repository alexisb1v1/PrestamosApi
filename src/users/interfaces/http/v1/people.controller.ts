import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FindPersonQuery } from '../../../application/queries/v1/find-person.query';
import { CreatePersonCommand } from '../../../application/commands/v1/create-person.command';
import { CreatePersonDto } from './dto/create-person.request.dto';
import { Person } from '../../../domain/entities/person.entity';

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
  @ApiResponse({
    status: 400,
    description: 'Invalid data or person already exists.',
  })
  async create(
    @Body() createPersonDto: CreatePersonDto,
  ): Promise<{ id: string }> {
    const { documentType, documentNumber, firstName, lastName, birthday } =
      createPersonDto;
    const command = new CreatePersonCommand(
      documentType,
      documentNumber,
      firstName,
      lastName,
      birthday ? new Date(birthday) : undefined,
    );
    const id = await this.commandBus.execute<CreatePersonCommand, string>(
      command,
    );
    return { id };
  }

  @Get('search')
  @ApiOperation({ summary: 'Find person by document' })
  @ApiQuery({ name: 'documentType', required: true })
  @ApiQuery({ name: 'documentNumber', required: true })
  @ApiResponse({ status: 200, description: 'Person found.' })
  @ApiResponse({ status: 404, description: 'Person not found.' })
  async findByDocument(
    @Query('documentType') documentType: string,
    @Query('documentNumber') documentNumber: string,
  ): Promise<Person> {
    const query = new FindPersonQuery(documentType, documentNumber);
    const person = await this.queryBus.execute<FindPersonQuery, Person | null>(
      query,
    );
    if (!person) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }
    return person;
  }
}
