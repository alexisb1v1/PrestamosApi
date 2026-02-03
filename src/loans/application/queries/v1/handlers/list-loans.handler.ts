import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListLoansQuery } from '../list-loans.query';
import { Inject } from '@nestjs/common';
import { LoanRepository } from '../../../../domain/repositories/loan.repository';
import { Loan } from '../../../../domain/entities/loan.entity';

@QueryHandler(ListLoansQuery)
export class ListLoansHandler implements IQueryHandler<ListLoansQuery> {
    constructor(
        @Inject(LoanRepository)
        private readonly loanRepository: LoanRepository,
    ) { }

    async execute(query: ListLoansQuery): Promise<Loan[]> {
        return this.loanRepository.findAllWithFilters(query.userId, query.documentNumber, query.companyId);
    }
}
