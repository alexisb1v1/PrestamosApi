import { Module } from '@nestjs/common';
import { HealthModule } from './health/infrastructure/nestjs/health.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansModule } from './loans/infrastructure/nestjs/loans.module';
import { UsersModule } from './users/infrastructure/nestjs/users.module';
import { ExpensesModule } from './expenses/infrastructure/nestjs/expenses.module';
import { CompaniesModule } from './companies/companies.module';

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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // ⚠️ NUNCA uses true en producción - puede causar pérdida de datos
        timezone: '-05:00',
      }),
    }),
    LoansModule,
    UsersModule,
    ExpensesModule,
    CompaniesModule,
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
export class AppModule {}
