import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanCommand } from '../create-loan.command';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { Loan } from '../../../../domain/entities/loan.entity';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

@CommandHandler(CreateLoanCommand)
export class CreateLoanHandler implements ICommandHandler<CreateLoanCommand, Result<void, AppError>> {
  constructor(
    @Inject(LoanRepository)
    private readonly loanRepository: LoanRepository,
  ) {}

  async execute(command: CreateLoanCommand): Promise<Result<void, AppError>> {
    const { idPeople, amount, userId, address, phone, days: requestedDays } = command;

    // 0. Validar que no tenga préstamo activo
    const activeLoan = await this.loanRepository.findActiveByPersonId(idPeople.toString());
    if (activeLoan) {
      return err('ALREADY_EXISTS');
    }

    // 1. Regla de negocio: mínimo 24 días
    if (requestedDays < 24) {
      return err('INVALID_INPUT');
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
