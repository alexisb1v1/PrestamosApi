import { Body, Controller, Post } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginQuery } from '@users/application/queries/v1/login.query';
import { LoginResponseDto } from '../dto/login.response.dto';
import { LoginDto } from '../dto/login.request.dto';
import { LoginResultDto } from '@users/application/queries/v1/dto/login-result.dto';
import { Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import { matchResult } from '@shared/http/match-result';
import { Public } from '@users/infrastructure/security/public.decorator';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class LoginAction {
  constructor(private readonly queryBus: QueryBus) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful.',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 403, description: 'Company inactive.' })
  async execute(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.queryBus.execute<
      LoginQuery,
      Result<LoginResultDto, AppError>
    >(new LoginQuery(dto.username, dto.password, dto.fingerprint, dto.tenant));
    return matchResult(
      result,
      (data) =>
        new LoginResponseDto(true, 'Login successful', data.token, data.user),
    );
  }
}
