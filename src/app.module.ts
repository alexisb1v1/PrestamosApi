import { Module } from '@nestjs/common';
import { HealthModule } from './health/infrastructure/nestjs/health.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { LoansModule } from './loans/infrastructure/nestjs/loans.module';
import { UsersModule } from './users/infrastructure/nestjs/users.module';
import { ExpensesModule } from './expenses/infrastructure/nestjs/expenses.module';
import { CompaniesModule } from './companies/companies.module';
import { ReportsModule } from './reports/infrastructure/nestjs/reports.module';

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL') || 60000,
          limit: configService.get<number>('THROTTLE_LIMIT') || 60,
        },
      ],
    }),
    DatabaseModule,
    LoansModule,
    UsersModule,
    ExpensesModule,
    CompaniesModule,
    ReportsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
