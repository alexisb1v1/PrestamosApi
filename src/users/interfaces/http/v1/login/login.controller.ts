import { Body, Controller, Post, HttpStatus, HttpException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.request.dto';
import { LoginResponseDto } from './dto/login.response.dto';
import { LoginQuery } from '../../../../application/queries/v1/login.query';
import { Public } from '../../../../infrastructure/security/public.decorator';

@ApiTags('Users')
@Public()
@Controller('api/v1/users')
export class LoginController {
    constructor(private readonly queryBus: QueryBus) { }

    @Post('login')
    @ApiOperation({ summary: 'Login user and get JWT token' })
    @ApiResponse({ status: 200, description: 'Login successful.', type: LoginResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
        const { username, passwordHash } = dto;

        const query = new LoginQuery(username, passwordHash);
        const result = await this.queryBus.execute(query);

        if (!result.success) {
            throw new HttpException(result.message, HttpStatus.UNAUTHORIZED);
        }

        return new LoginResponseDto(result.success, result.message, result.token, result.user);
    }
}
