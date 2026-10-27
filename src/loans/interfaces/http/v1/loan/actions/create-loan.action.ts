import { Controller, Post, Body, Req, ForbiddenException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateLoanCommand } from '@loans/application/commands/v1/create-loan.command';
import { CreateLoanDto } from '../dto/create-loan.request.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';
import { LoanAppDto } from '@loans/application/queries/v1/dto/loan-app.dto';
import { LoanMapper } from '@loans/application/queries/v1/mappers/loan.mapper';
import { Loan } from '@loans/domain/entities/loan.entity';

@ApiTags('Loan')
@ApiBearerAuth()
@Controller('api/v1/loan')
export class CreateLoanAction {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Apply for a new loan' })
  @ApiResponse({
    status: 201,
    description: 'Loan application created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Loan already exists or invalid data.',
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para operar en otra empresa o usuario.',
  })
  async execute(
    @Body() dto: CreateLoanDto,
    @Req() req: any,
  ): Promise<LoanAppDto> {
    const userProfile = req.user?.profile;
    const isOwner = userProfile === 'OWNER';
    const isCobrador = userProfile === 'COBRADOR';

    // Anti-suplantación (BOLA/OWASP API1):
    // Un cobrador no puede crear préstamos a nombre de otro usuario ni de otra empresa
    let effectiveUserId = dto.userId;
    let effectiveCompanyId = dto.companyId || req.user?.companyId;

    if (!isOwner) {
      if (req.user?.companyId && dto.companyId && String(dto.companyId) !== String(req.user.companyId)) {
        throw new ForbiddenException('No tiene permisos para crear préstamos en otra empresa.');
      }
      effectiveCompanyId = req.user?.companyId;

      if (isCobrador && req.user?.sub && Number(dto.userId) !== Number(req.user.sub)) {
        throw new ForbiddenException('El cobrador solo puede registrar préstamos asociados a su propia cuenta.');
      }
      if (isCobrador && req.user?.sub) {
        effectiveUserId = Number(req.user.sub);
      }
    }

    const companySettings = req.company?.settings;

    const result = await this.commandBus.execute<
      CreateLoanCommand,
      Result<Loan, AppError>
    >(
      new CreateLoanCommand(
        dto.idPeople,
        dto.amount,
        effectiveUserId,
        dto.address,
        dto.phone,
        dto.days,
        effectiveCompanyId ? String(effectiveCompanyId) : undefined,
        userProfile,
        companySettings,
      ),
    );
    return matchResult(result, (loan) => LoanMapper.toLoanAppDto(loan));
  }
}
