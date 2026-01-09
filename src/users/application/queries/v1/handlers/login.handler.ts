import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { LoginQuery } from '../login.query';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { PersonRepository } from '../../../../domain/repositories/person.repository';

export class LoginResult {
    constructor(
        public readonly success: boolean,
        public readonly message: string,
        public readonly token?: string,
        public readonly user?: {
            id: string;
            username: string;
            profile: string;
            status: string;
            person: {
                id: string;
                documentType: string;
                documentNumber: string;
                firstName: string;
                lastName: string;
                birthday: Date;
            };
        },
    ) { }
}

@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery, LoginResult> {
    constructor(
        @Inject(UserRepository)
        private readonly userRepository: UserRepository,
        @Inject(PersonRepository)
        private readonly personRepository: PersonRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(query: LoginQuery): Promise<LoginResult> {
        try {
            const { username, passwordHash } = query;

            // 1. Find user by username
            const user = await this.userRepository.findByUsername(username);

            if (!user) {
                return new LoginResult(false, 'Invalid credentials');
            }

            // 2. Verify password hash
            if (user.passwordHash !== passwordHash) {
                return new LoginResult(false, 'Invalid credentials');
            }

            // 3. Get person data
            const person = await this.personRepository.findById(user.idPeople.toString());

            if (!person) {
                return new LoginResult(false, 'User data incomplete');
            }

            // 4. Generate JWT token
            const payload = {
                sub: user.id,
                username: user.username,
                profile: user.profile,
                personId: person.id,
            };

            const token = this.jwtService.sign(payload);

            // 5. Return user with person data and token
            return new LoginResult(true, 'Login successful', token, {
                id: user.id!,
                username: user.username,
                profile: user.profile,
                status: user.status,
                person: {
                    id: person.id!,
                    documentType: person.documentType,
                    documentNumber: person.documentNumber,
                    firstName: person.firstName,
                    lastName: person.lastName,
                    birthday: person.birthday,
                },
            });
        } catch (error) {
            return new LoginResult(false, `Login failed: ${error.message}`);
        }
    }
}
