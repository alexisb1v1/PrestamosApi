export class LoanInstallment {
    constructor(
        public readonly loanId: string,
        public readonly installmentDate: Date,
        public readonly amount: number,
        public readonly userId: string,
        public readonly status: string = 'PAID',
        public readonly id?: string,
        public readonly userName?: string,
        public readonly paymentType?: string,
    ) { }
}
