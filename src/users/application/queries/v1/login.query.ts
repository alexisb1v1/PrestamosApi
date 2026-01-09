export class LoginQuery {
    constructor(
        public readonly username: string,
        public readonly passwordHash: string,
    ) { }
}
