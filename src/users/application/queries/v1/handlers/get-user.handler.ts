import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserQuery } from '../get-user.query';
import { Inject } from '@nestjs/common';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { User } from '../../../../domain/entities/user.entity';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import { Person } from '../../../../domain/entities/person.entity';

export class GetUserResult {
    constructor(
        public readonly success: boolean,
        public readonly message: string,
        public readonly user?: User,
        public readonly person?: Person,
    ) { }
}

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, GetUserResult> {
    constructor(
        @Inject(UserRepository)
        private readonly userRepository: UserRepository,
        @Inject(PersonRepository)
        private readonly personRepository: PersonRepository,
    ) { }

    async execute(query: GetUserQuery): Promise<GetUserResult> {
        const user = await this.userRepository.findById(query.id);
        if (!user) {
            return new GetUserResult(false, 'User not found');
        }

        const person = await this.personRepository.findById(user.idPeople.toString());

        return new GetUserResult(true, 'User found', user, person || undefined);
    }
}
