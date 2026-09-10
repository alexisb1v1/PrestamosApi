import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanCommand } from '../create-loan.command';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '@loans/domain/repositories/loan.repository';
import { Loan } from '@loans/domain/entities/loan.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(CreateLoanCommand)
export class CreateLoanHandler implements ICommandHandler<
  CreateLoanCommand,
  Result<void, AppError>
> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  /**
   * Crea un nuevo préstamo para una persona, validando reglas de negocio
   * como el mínimo de días (24) e intereses (20%).
   *
   * @param command - Datos para la creación del préstamo, incluyendo:
   *   - `idPeople`: ID de la persona solicitante.
   *   - `amount`: Monto base del préstamo.
   *   - `days`: Plazo solicitado en días.
   *   - `userId`: ID del cobrador/usuario que registra.
   *
   * @returns `Result.ok(void)` si se creó exitosamente.
   * @returns `Result.err('LOAN_ALREADY_ACTIVE')` si ya existe un préstamo activo.
   * @returns `Result.err('LOAN_INVALID_DAYS')` si los días solicitados son menores a 24.
   */
  async execute(command: CreateLoanCommand): Promise<Result<void, AppError>> {
    const {
      idPeople,
      amount,
      userId,
      address,
      phone,
      days: requestedDays,
    } = command;

    // 0. Validar que no tenga préstamo activo
    const activeLoan = await this.loanRepository.findActiveByPersonId(
      idPeople.toString(),
    );
    if (activeLoan) {
      return err('LOAN_ALREADY_ACTIVE');
    }

    // 1. Regla de negocio: mínimo 24 días
    if (requestedDays < 24) {
      return err('LOAN_INVALID_DAYS');
    }

    // 2. Cálculos
    const interest = amount * 0.2;
    const totalAmount = amount + interest;
    const days = amount < 1000 ? 24 : requestedDays;
    const fee = totalAmount / days;

    // 3. Fecha de inicio (mañana, sin domingo)
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() + 1);
    if (startDate.getDay() === 0) {
      startDate.setDate(startDate.getDate() + 1);
    }

    // 4. Fecha de fin (días hábiles, sin domingos)
    const endDate = new Date(startDate);
    let workDaysAdded = startDate.getDay() !== 0 ? 1 : 0;
    while (workDaysAdded < days) {
      endDate.setDate(endDate.getDate() + 1);
      if (endDate.getDay() !== 0) {
        workDaysAdded++;
      }
    }

    const newLoan = new Loan(
      idPeople,
      startDate,
      endDate,
      amount,
      interest,
      fee,
      days,
      new Date(),
      userId,
      'Activo',
      address,
      phone,
    );

    await this.loanRepository.save(newLoan);
    return ok(undefined);
  }
}
