import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CreateLoanCommand } from '../../../../application/commands/v1/create-loan.command';
import { ListLoansQuery } from '../../../../application/queries/v1/list-loans.query';
import { GetLoanDetailsQuery } from '../../../../application/queries/v1/get-loan-details.query';
import { ReassignLoanCommand } from '../../../../application/commands/v1/reassign-loan.command';
import { DeleteLoanCommand } from '../../../../application/commands/v1/delete-loan.command';
import { UpdateLoanInfoCommand } from '../../../../application/commands/v1/update-loan-info.command';

import { CreateLoanDto } from './dto/create-loan.request.dto';
import { ReassignLoanDto } from './dto/reassign-loan.request.dto';
import { UpdateLoanInfoDto } from './dto/update-loan-info.request.dto';
import { LoanResponseDto } from './dto/loan.response.dto';
import { LoanDetailsResponseDto } from './dto/loan-details.response.dto';

import { LoanAppDto } from '../../../../application/queries/v1/dto/loan-app.dto';
import { Roles } from '../../../../../users/infrastructure/security/roles.decorator';
import { RolesGuard } from '../../../../../users/infrastructure/security/roles.guard';
import { Result } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { matchResult } from '../../../../../common/http/match-result';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('api/v1/loans')
export class LoanController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Apply for a new loan' })
  @ApiResponse({ status: 201, description: 'Loan application created successfully.' })
  @ApiResponse({ status: 400, description: 'Loan already exists or invalid data.' })
  async create(@Body() dto: CreateLoanDto): Promise<void> {
    const result = await this.commandBus.execute<CreateLoanCommand, Result<void, AppError>>(
      new CreateLoanCommand(dto.idPeople, dto.amount, dto.userId, dto.address, dto.phone, dto.days),
    );
    return matchResult(result, () => undefined, {
      ALREADY_EXISTS: 'La persona ya tiene un préstamo activo. No se puede registrar uno nuevo.',
      INVALID_INPUT: 'La cantidad de días mínima para un préstamo es de 24 días.',
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all loans with optional filters' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'searchQuery', required: false, type: String, description: 'Búsqueda por DNI o Nombre' })
  @ApiQuery({ name: 'companyId', required: false, type: Number })
  @ApiQuery({ name: 'isLiquidated', required: true, type: Boolean, description: 'Filtrar por liquidados (true) o activos (false)' })
  @ApiResponse({ status: 200, description: 'List of loans retrieved successfully.', type: [LoanResponseDto] })
  async findAll(
    @Query('userId') userId?: number,
    @Query('searchQuery') searchQuery?: string,
    @Query('companyId') companyId?: number,
    @Query('isLiquidated') isLiquidated?: string,
  ): Promise<LoanResponseDto[]> {
    const isLiquidatedBool = isLiquidated === 'true';
    const result = await this.queryBus.execute<ListLoansQuery, Result<LoanAppDto[], AppError>>(
      new ListLoansQuery(isLiquidatedBool, userId, searchQuery, companyId),
    );
    return matchResult(result, (loans) => loans.map((loan) => new LoanResponseDto(loan)));
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get detailed information of a loan including its installments' })
  @ApiResponse({ status: 200, description: 'Loan details retrieved successfully.', type: LoanDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async getDetails(@Param('id') id: string): Promise<LoanDetailsResponseDto> {
    const result = await this.queryBus.execute<GetLoanDetailsQuery, Result<LoanAppDto, AppError>>(
      new GetLoanDetailsQuery(id),
    );
    return matchResult(result, (loan) => new LoanDetailsResponseDto(loan));
  }

  @Patch(':id/reassign')
  @ApiOperation({ summary: 'Reassign a loan to a different user' })
  @ApiResponse({ status: 200, description: 'Loan reassigned successfully.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async reassign(@Param('id') id: string, @Body() dto: ReassignLoanDto): Promise<void> {
    const result = await this.commandBus.execute<ReassignLoanCommand, Result<void, AppError>>(
      new ReassignLoanCommand(id, dto.newUserId),
    );
    return matchResult(result, () => undefined, {
      NOT_FOUND: `Préstamo con ID ${id} no encontrado.`,
    });
  }

  @Patch(':id/info')
  @ApiOperation({ summary: 'Update the contact information (phone and address) of a loan borrower' })
  @ApiResponse({ status: 200, description: 'Loan information updated successfully.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async updateInfo(@Param('id') id: string, @Body() dto: UpdateLoanInfoDto): Promise<void> {
    const result = await this.commandBus.execute<UpdateLoanInfoCommand, Result<void, AppError>>(
      new UpdateLoanInfoCommand(id, dto.phone, dto.address),
    );
    return matchResult(result, () => undefined, {
      NOT_FOUND: `Préstamo con ID ${id} no encontrado.`,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'OWNER')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Logically delete a loan (sets status to Eliminado)' })
  @ApiResponse({ status: 200, description: 'Loan logically deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN or OWNER can delete loans.' })
  @ApiResponse({ status: 404, description: 'Loan not found.' })
  async delete(@Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute<DeleteLoanCommand, Result<void, AppError>>(
      new DeleteLoanCommand(id),
    );
    return matchResult(result, () => undefined, {
      NOT_FOUND: `Préstamo con ID ${id} no encontrado.`,
    });
  }
}
