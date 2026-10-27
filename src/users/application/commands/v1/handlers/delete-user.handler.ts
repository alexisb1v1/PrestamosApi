import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../delete-user.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

/**
 * IDs de usuarios protegidos (accesos públicos de la empresa demo).
 * No pueden ser eliminados para garantizar el acceso de quienes prueban el sistema.
 */
const PROTECTED_USER_IDS: readonly string[] = ['9', '11'];

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<
  DeleteUserCommand,
  Result<void, AppError>
> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Desactiva un usuario cambiando su estado a 'INACTIVE'.
   *
   * @param command - Datos de la solicitud:
   *   - `id`: ID del usuario a desactivar.
   *
   * @returns `Result.ok(void)` si la desactivación fue exitosa.
   * @returns `Result.err('USER_NOT_FOUND')` si el usuario no existe.
   * @returns `Result.err('PROTECTED_USER_CANNOT_BE_DELETED')` si es un usuario demo protegido.
   */
  async execute(command: DeleteUserCommand): Promise<Result<void, AppError>> {
    if (PROTECTED_USER_IDS.includes(String(command.id))) {
      return err('PROTECTED_USER_CANNOT_BE_DELETED');
    }

    const user = await this.userRepository.findById(command.id);
    if (!user) {
      return err('USER_NOT_FOUND');
    }

    user.status = 'INACTIVE';
    await this.userRepository.save(user);
    return ok(undefined);
  }
}
