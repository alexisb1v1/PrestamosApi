import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCollectionOrderCommand } from '../update-collection-order.command';
import { Inject } from '@nestjs/common';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(UpdateCollectionOrderCommand)
export class UpdateCollectionOrderHandler implements ICommandHandler<
  UpdateCollectionOrderCommand,
  Result<void, AppError>
> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Actualiza el orden de cobro (secuencia de visitas) sugerido para un usuario.
   *
   * @param command - Datos de la solicitud:
   *   - `userId`: ID del usuario.
   *   - `collectionOrder`: Array con la secuencia de IDs de préstamos o personas.
   *
   * @returns `Result.ok(void)` si el orden fue guardado exitosamente.
   * @returns `Result.err('NOT_FOUND')` si el usuario no existe.
   */
  async execute(
    command: UpdateCollectionOrderCommand,
  ): Promise<Result<void, AppError>> {
    const { userId, collectionOrder } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return err('NOT_FOUND');
    }

    await this.userRepository.updateCollectionOrder(userId, collectionOrder);
    return ok(undefined);
  }
}
