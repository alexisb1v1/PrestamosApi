import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResetUserPasswordCommand } from '../reset-user-password.command';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '@users/domain/repositories/user.repository';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';

@CommandHandler(ResetUserPasswordCommand)
export class ResetUserPasswordHandler
  implements ICommandHandler<ResetUserPasswordCommand, Result<void, AppError>>
{
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(
    command: ResetUserPasswordCommand,
  ): Promise<Result<void, AppError>> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      return err('USER_NOT_FOUND');
    }

    if (String(user.idCompany) === '102') {
      return err('DEMO_PASSWORD_CHANGE_BLOCKED');
    }

    let documentNumber = user.person?.documentNumber;
    if (!documentNumber && user.idPeople) {
      const person = await this.personRepository.findById(
        user.idPeople.toString(),
      );
      documentNumber = person?.documentNumber;
    }

    if (!documentNumber) {
      return err('PERSON_DOCUMENT_NOT_FOUND');
    }

    const hashedPassword = await bcrypt.hash(documentNumber, 10);
    await this.userRepository.updatePasswordHash(user.id!, hashedPassword);

    return ok(undefined);
  }
}
