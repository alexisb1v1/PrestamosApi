import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ToggleDayStatusCommand } from '../toggle-day-status.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(ToggleDayStatusCommand)
export class ToggleDayStatusHandler implements ICommandHandler<
  ToggleDayStatusCommand,
  Result<void, AppError>
> {
  constructor(
    @Inject(UserRepository)
    private readonly repository: UserRepository,
  ) {}

  /**
   * Actualiza el estado del día (abierto/cerrado) para un usuario (cobrador).
   * Un día cerrado podría restringir ciertas operaciones en el dashboard.
   *
   * @param command - Datos de la solicitud:
   *   - `userId`: ID del usuario.
   *   - `isDayClosed`: Nuevo estado del día (true para cerrado).
   *
   * @returns `Result.ok(void)` si el estado se actualizó correctamente.
   * @returns `Result.err('NOT_FOUND')` si el usuario no existe.
   */
  async execute(
    command: ToggleDayStatusCommand,
  ): Promise<Result<void, AppError>> {
    const { userId, isDayClosed } = command;
    const user = await this.repository.findById(userId);

    if (!user) {
      return err('NOT_FOUND');
    }

    user.isDayClosed = isDayClosed;
    await this.repository.save(user);
    return ok(undefined);
  }
}
