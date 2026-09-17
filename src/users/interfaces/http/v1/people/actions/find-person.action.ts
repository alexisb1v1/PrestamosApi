import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FindPersonQuery } from '@users/application/queries/v1/find-person.query';
import { FindPersonResponseDto } from '../dto/find-person.response.dto';
import { Person } from '@users/domain/entities/person.entity';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';

@ApiTags('Person')
@ApiBearerAuth()
@Controller('api/v1/person')
export class FindPersonAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('search')
  @ApiOperation({ summary: 'Find person by document' })
  @ApiQuery({ name: 'documentType', required: true })
  @ApiQuery({ name: 'documentNumber', required: true })
  @ApiResponse({
    status: 200,
    description: 'Person found.',
    type: FindPersonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Person not found.' })
  async execute(
    @Query('documentType') documentType: string,
    @Query('documentNumber') documentNumber: string,
  ): Promise<FindPersonResponseDto> {
    const result = await this.queryBus.execute<
      FindPersonQuery,
      Result<Person, AppError>
    >(new FindPersonQuery(documentType, documentNumber));
    return matchResult(result, (person) => {
      const birthdayValue = person.birthday;
      let birthdayStr: string | null = null;
      if (birthdayValue) {
        birthdayStr =
          birthdayValue instanceof Date
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
        phone: person.phone,
        address: person.address,
      };
    });
  }
}
