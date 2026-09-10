import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '@companies/infrastructure/nestjs/companies.module';
import { CreateUserHandler } from '@users/application/commands/v1/handlers/create-user.handler';
import { CreatePersonHandler } from '@users/application/commands/v1/handlers/create-person.handler';
import { UpdateUserHandler } from '@users/application/commands/v1/handlers/update-user.handler';
import { DeleteUserHandler } from '@users/application/commands/v1/handlers/delete-user.handler';
import { LoginHandler } from '@users/application/queries/v1/handlers/login.handler';
import { GetUserHandler } from '@users/application/queries/v1/handlers/get-user.handler';
import { ListUsersHandler } from '@users/application/queries/v1/handlers/list-users.handler';
import { FindPersonHandler } from '@users/application/queries/v1/handlers/find-person.handler';
import { ToggleDayStatusHandler } from '@users/application/commands/v1/handlers/toggle-day-status.handler';
import { UpdateCollectionOrderHandler } from '@users/application/commands/v1/handlers/update-collection-order.handler';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { PostgresUserRepository } from '../repositories/postgres-user.repository';
import { PostgresPersonRepository } from '../repositories/postgres-person.repository';
import { UserEntity } from '../repositories/entities/user.entity';
import { PersonEntity } from '../repositories/entities/person.entity';
import { CreateUserAction } from '@users/interfaces/http/v1/user/actions/create-user.action';
import { ListUsersAction } from '@users/interfaces/http/v1/user/actions/list-users.action';
import { GetUserAction } from '@users/interfaces/http/v1/user/actions/get-user.action';
import { UpdateUserAction } from '@users/interfaces/http/v1/user/actions/update-user.action';
import { DeleteUserAction } from '@users/interfaces/http/v1/user/actions/delete-user.action';
import { ToggleDayStatusAction } from '@users/interfaces/http/v1/user/actions/toggle-day-status.action';
import { UpdateCollectionOrderAction } from '@users/interfaces/http/v1/user/actions/update-collection-order.action';
import { CreatePersonAction } from '@users/interfaces/http/v1/people/actions/create-person.action';
import { FindPersonAction } from '@users/interfaces/http/v1/people/actions/find-person.action';
import { LoginAction } from '@users/interfaces/http/v1/login/actions/login.action';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity, PersonEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '10m' },
      }),
      inject: [ConfigService],
    }),
    CompaniesModule,
  ],
  controllers: [
    LoginAction,
    CreateUserAction,
    ListUsersAction,
    GetUserAction,
    UpdateUserAction,
    DeleteUserAction,
    ToggleDayStatusAction,
    UpdateCollectionOrderAction,
    CreatePersonAction,
    FindPersonAction,
  ],
  providers: [
    CreateUserHandler,
    CreatePersonHandler,
    UpdateUserHandler,
    DeleteUserHandler,
    LoginHandler,
    GetUserHandler,
    ListUsersHandler,
    FindPersonHandler,
    ToggleDayStatusHandler,
    UpdateCollectionOrderHandler,
    {
      provide: UserRepository,
      useClass: PostgresUserRepository,
    },
    {
      provide: PersonRepository,
      useClass: PostgresPersonRepository,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [UserRepository, PersonRepository],
})
export class UsersModule {}
