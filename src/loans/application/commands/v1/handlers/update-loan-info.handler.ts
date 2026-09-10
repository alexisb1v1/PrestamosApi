import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanInfoCommand } from '../update-loan-info.command';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(UpdateLoanInfoCommand)
export class UpdateLoanInfoHandler implements ICommandHandler<
  UpdateLoanInfoCommand,
  Result<void, AppError>
> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  /**
   * Actualiza la información de contacto (teléfono y dirección) de un préstamo activo.
   *
   * @param command - Datos a actualizar:
   *   - `id`: ID del préstamo.
   *   - `phone`: Nuevo número de teléfono.
   *   - `address`: Nueva dirección de contacto.
   *
   * @returns `Result.ok(void)` si la actualización fue exitosa.
   * @returns `Result.err('NOT_FOUND')` si el préstamo no existe.
   */
  async execute(
    command: UpdateLoanInfoCommand,
  ): Promise<Result<void, AppError>> {
    const { id, phone, address } = command;

    const loan = await this.loanRepository.findById(id);
    if (!loan) {
      return err('NOT_FOUND');
    }

    loan.phone = phone;
    loan.address = address;
    await this.loanRepository.save(loan);
    return ok(undefined);
  }
}
