import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ListCompaniesQuery } from '../../../../application/queries/v1/list-companies.query';
import { CompanyResponseDto } from '../dto/company-response.dto';
import { Company } from '../../../../domain/entities/company.entity';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('api/v1/companies')
export class ListCompaniesController {
    constructor(private readonly queryBus: QueryBus) { }

    @Get()
    @ApiOperation({ summary: 'List all companies' })
    @ApiResponse({ status: 200, description: 'Companies retrieved successfully', type: [CompanyResponseDto] })
    async findAll(): Promise<CompanyResponseDto[]> {
        const query = new ListCompaniesQuery();
        const companies: Company[] = await this.queryBus.execute(query);
        return companies.map(company => new CompanyResponseDto(company));
    }
}
