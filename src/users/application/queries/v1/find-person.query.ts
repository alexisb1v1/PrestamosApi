export class FindPersonQuery {
    constructor(
        public readonly documentType: string,
        public readonly documentNumber: string,
    ) { }
}
