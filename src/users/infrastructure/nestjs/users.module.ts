import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserHandler } from '../../application/commands/v1/handlers/create-user.handler';
import { CreatePersonHandler } from '../../application/commands/v1/handlers/create-person.handler';
import { UpdateUserHandler } from '../../application/commands/v1/handlers/update-user.handler';
import { DeleteUserHandler } from '../../application/commands/v1/handlers/delete-user.handler';
import { LoginHandler } from '../../application/queries/v1/handlers/login.handler';
import { GetUserHandler } from '../../application/queries/v1/handlers/get-user.handler';
import { ListUsersHandler } from '../../application/queries/v1/handlers/list-users.handler';
import { FindPersonHandler } from '../../application/queries/v1/handlers/find-person.handler';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PersonRepository } from '../../domain/repositories/person.repository';
import { PostgresUserRepository } from '../repositories/postgres-user.repository';
import { PostgresPersonRepository } from '../repositories/postgres-person.repository';
import { UserEntity } from '../repositories/entities/user.entity';
import { PersonEntity } from '../repositories/entities/person.entity';
import { CreateUserController } from '../../interfaces/http/v1/create-user/create-user.controller';
import { LoginController } from '../../interfaces/http/v1/login/login.controller';
import { UserController } from '../../interfaces/http/v1/user.controller';
import { PeopleController } from '../../interfaces/http/v1/people.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([UserEntity, PersonEntity]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '24h' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [CreateUserController, LoginController, UserController, PeopleController],
    providers: [
        CreateUserHandler,
        CreatePersonHandler,
        UpdateUserHandler,
        DeleteUserHandler,
        LoginHandler,
        GetUserHandler,
        ListUsersHandler,
        FindPersonHandler,
        {
            provide: UserRepository,
            useClass: PostgresUserRepository,
        },
        {
            provide: PersonRepository,
            useClass: PostgresPersonRepository,
        },
    ],
    exports: [UserRepository, PersonRepository],
})
export class UsersModule { }
