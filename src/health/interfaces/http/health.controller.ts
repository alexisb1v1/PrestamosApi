import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../users/infrastructure/security/public.decorator';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator,
    ) { }

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Check application health' })
    healthCheck() {
        return this.health.check([
            () => this.http.pingCheck('google', 'https://google.com'),
        ]);
    }
}
