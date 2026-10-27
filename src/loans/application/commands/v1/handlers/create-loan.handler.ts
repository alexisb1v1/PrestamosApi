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
  Result<Loan, AppError>
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
  async execute(command: CreateLoanCommand): Promise<Result<Loan, AppError>> {
    const {
      idPeople,
      amount,
      userId,
      address,
      phone,
      days: requestedDays,
      userProfile,
      companySettings,
    } = command;

    // 0. Validar que no tenga préstamo activo
    const activeLoan = await this.loanRepository.findActiveByPersonId(
      idPeople.toString(),
      command.companyId,
    );
    if (activeLoan) {
      return err('LOAN_ALREADY_ACTIVE');
    }

    // 1. Obtener políticas de préstamo del tenant
    const defaultDays = Number(companySettings?.loans?.defaultDays ?? 24);
    const defaultInterestRate = Number(companySettings?.loans?.defaultInterestRate ?? 20);
    const allowCollectorOverride =
      companySettings?.loans?.allowCollectorOverrideOver1000 ?? true;

    // 2. Determinar días contractuales según rol y política de la empresa
    const isCobrador = userProfile?.toUpperCase() === 'COBRADOR';
    let days = defaultDays;

    if (isCobrador) {
      if (!allowCollectorOverride || amount < 1000) {
        // Bloqueo estricto: cobrador forzado a los días base de la empresa
        days = defaultDays;
      } else {
        // Monto >= 1000 y empresa permite excepción al cobrador
        days = requestedDays >= defaultDays ? requestedDays : defaultDays;
      }
    } else {
      // Perfiles Administrador / Owner
      days = requestedDays >= defaultDays ? requestedDays : defaultDays;
    }

    if (days < defaultDays) {
      return err('LOAN_INVALID_DAYS');
    }

    // 3. Cálculos de interés con la tasa oficial pactada de la empresa
    const interestRate = defaultInterestRate;
    const interest = amount * (interestRate / 100);
    const totalAmount = amount + interest;
    const fee = totalAmount / days;

    // 4. Fecha de inicio (mañana, sin domingo)
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() + 1);
    if (startDate.getDay() === 0) {
      startDate.setDate(startDate.getDate() + 1);
    }

    // 5. Fecha de fin (días hábiles, sin domingos)
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
      undefined,
      command.companyId,
    );
    newLoan.interestRate = interestRate;

    const savedLoan = await this.loanRepository.save(newLoan);
    return ok(savedLoan);
  }
}
