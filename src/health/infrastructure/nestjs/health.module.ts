import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthAction } from '@health/interfaces/http/actions/health.action';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthAction],
})
export class HealthModule {}
