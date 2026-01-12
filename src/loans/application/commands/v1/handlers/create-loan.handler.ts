import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanCommand } from '../create-loan.command';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { PersonRepository } from '../../../../../users/domain/repositories/person.repository';
import { Loan } from '../../../../domain/entities/loan.entity';

@CommandHandler(CreateLoanCommand)
export class CreateLoanHandler implements ICommandHandler<CreateLoanCommand> {
    constructor(
        @Inject(LoanRepository)
        private readonly loanRepository: LoanRepository,
        @Inject(PersonRepository)
        private readonly personRepository: PersonRepository,
    ) { }

    async execute(command: CreateLoanCommand): Promise<void> {
        const { idPeople, amount, userId, address } = command;

        // 0. Check if the person already has an active loan
        const activeLoan = await this.loanRepository.findActiveByPersonId(idPeople.toString());
        if (activeLoan) {
            throw new HttpException(
                `La persona ya tiene un préstamo activo No se puede registrar uno nuevo.`,
                HttpStatus.BAD_REQUEST
            );
        }

        // 1. Calculations
        const interest = amount * 0.20;
        const totalAmount = amount + interest;
        const days = 24;
        const fee = totalAmount / days;

        // 2. Start Date (Tomorrow, skip Sunday)
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() + 1);

        if (startDate.getDay() === 0) { // Sunday
            startDate.setDate(startDate.getDate() + 1); // Monday
        }

        // 3. End Date (work days, skip Sundays)
        const endDate = new Date(startDate);
        let workDaysAdded = 0;
        while (workDaysAdded < days) {
            endDate.setDate(endDate.getDate() + 1);
            if (endDate.getDay() !== 0) { // Not Sunday
                workDaysAdded++;
            }
        }

        const createdAt = new Date();
        const status = 'Activo';

        const newLoan = new Loan(
            idPeople,
            startDate,
            endDate,
            amount,
            interest,
            fee,
            days,
            createdAt,
            userId,
            status,
            address
        );

        await this.loanRepository.save(newLoan);
    }
}
