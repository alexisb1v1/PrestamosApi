export class GetDashboardQuery {
    constructor(
        public readonly userId?: string,
        public readonly companyId?: string,
    ) { }
}
