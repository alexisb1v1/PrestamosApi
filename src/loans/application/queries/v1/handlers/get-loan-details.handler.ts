import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoanDetailsQuery } from '../get-loan-details.query';
import { Inject, HttpException, HttpStatus } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { Loan } from '../../../../domain/entities/loan.entity';

@QueryHandler(GetLoanDetailsQuery)
export class GetLoanDetailsHandler implements IQueryHandler<GetLoanDetailsQuery, Loan> {
    constructor(
        @Inject(LoanRepository)
        private readonly loanRepository: LoanRepository,
    ) { }

    async execute(query: GetLoanDetailsQuery): Promise<Loan> {
        const loan = await this.loanRepository.findWithInstallments(query.loanId);

        if (!loan) {
            throw new HttpException('Préstamo no encontrado', HttpStatus.NOT_FOUND);
        }

        return loan;
    }
}
