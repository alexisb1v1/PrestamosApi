import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from '../delete-user.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

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
   */
  async execute(command: DeleteUserCommand): Promise<Result<void, AppError>> {
    const user = await this.userRepository.findById(command.id);
    if (!user) {
      return err('USER_NOT_FOUND');
    }

    user.status = 'INACTIVE';
    await this.userRepository.save(user);
    return ok(undefined);
  }
}
