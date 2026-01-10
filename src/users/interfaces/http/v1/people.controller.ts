import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FindPersonQuery } from '../../../application/queries/v1/find-person.query';
import { Person } from '../../../domain/entities/person.entity';

@ApiTags('People')
@Controller('api/v1/people')
export class PeopleController {
    constructor(private readonly queryBus: QueryBus) { }

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
        const person = await this.queryBus.execute(query);
        if (!person) {
            throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
        }
        return person;
    }
}
