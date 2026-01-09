export class CreateLoanCommand {
    constructor(
        public readonly idPeople: number,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly amount: number,
        public readonly interest: number,
        public readonly fee: number,
        public readonly userId: number,
    ) { }
}
