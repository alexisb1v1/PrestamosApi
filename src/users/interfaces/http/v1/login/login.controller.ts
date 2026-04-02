import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginQuery } from '../../../../application/queries/v1/login.query';
import { LoginResponseDto } from './dto/login.response.dto';
import { LoginDto } from './dto/login.request.dto';
import { LoginResultDto } from '../../../../application/queries/v1/dto/login-result.dto';

import { Result } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';
import { matchResult } from '../../../../../common/http/match-result';
import { Public } from '../../../../infrastructure/security/public.decorator';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class LoginController {
  constructor(private readonly queryBus: QueryBus) { }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful.', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 403, description: 'Company inactive.' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.queryBus.execute<LoginQuery, Result<LoginResultDto, AppError>>(
      new LoginQuery(dto.username, dto.password, dto.fingerprint),
    );
    return matchResult(result, (data) => new LoginResponseDto(true, 'Login successful', data.token, data.user));
  }
}
