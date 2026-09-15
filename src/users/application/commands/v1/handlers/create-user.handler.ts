import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../create-user.command';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { User } from '@users/domain/entities/user.entity';
import { Person } from '@users/domain/entities/person.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<
  CreateUserCommand,
  Result<string, AppError>
> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  /**
   * Crea un nuevo usuario y su información personal asociada.
   * Si la persona ya existe (por número de documento), asocia el usuario a ella.
   *
   * @param command - Datos requeridos para el usuario y la persona:
   *   - `username`: Nombre de usuario único.
   *   - `passwordHash`: Contraseña en texto plano para ser hasheada.
   *   - `profile`: Perfil/Rol del usuario.
   *   - `documentNumber`: Documento de identidad para vinculación de persona.
   *
   * @returns `Result.ok(string)` con el ID del usuario creado.
   */
  async execute(command: CreateUserCommand): Promise<Result<string, AppError>> {
    const {
      username,
      passwordHash,
      profile,
      documentType,
      documentNumber,
      firstName,
      lastName,
      birthday,
      idCompany,
    } = command;

    let personId: string;

    const existingPerson =
      await this.personRepository.findByDocumentNumber(documentNumber);
    if (existingPerson) {
      personId = existingPerson.id!;
    } else {
      const newPerson = new Person(
        documentType,
        documentNumber,
        firstName,
        lastName,
        birthday,
      );
      personId = await this.personRepository.save(newPerson);
    }

    const existingUser = idCompany
      ? await this.userRepository.findByUsernameAndCompany(username, idCompany.toString())
      : await this.userRepository.findByUsername(username);
    if (existingUser) {
      return err('USER_ALREADY_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    const newUser = new User(
      username,
      hashedPassword,
      profile,
      'ACTIVE',
      Number(personId),
      undefined,
      false,
      idCompany,
    );

    const userId = await this.userRepository.save(newUser);
    return ok(userId);
  }
}
