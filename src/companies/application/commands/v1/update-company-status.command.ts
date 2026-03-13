export class UpdateCompanyStatusCommand {
    constructor(
        public readonly id: string,
        public readonly status: string,
    ) { }
}
