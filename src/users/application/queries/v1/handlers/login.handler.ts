import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { LoginQuery } from '../login.query';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../../companies/domain/repositories/company.repository';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '../../../../../common/errors/app-errors';

import { LoginResultDto } from '../dto/login-result.dto';
import { LoginMapper } from '../mappers/login.mapper';

@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery, Result<LoginResultDto, AppError>> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    private readonly jwtService: JwtService,
  ) { }

  async execute(query: LoginQuery): Promise<Result<LoginResultDto, AppError>> {
    const { username, password, fingerprint } = query;
    // 1. Find user by username
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return err('UNAUTHORIZED');
    }

    if (!user.isActive()) {
      return err('UNAUTHORIZED');
    }

    // 2. Validate Company Status (Excluding OWNER)
    let companyStatus: string | undefined;
    if (user.idCompany) {
      const company = await this.companyRepository.findById(user.idCompany);
      if (company) {
        companyStatus = company.getNormalizedStatus();

        if (user.profile !== 'OWNER' && companyStatus !== 'ACTIVE') {
          return err('FORBIDDEN');
        }
      }
    }

    // 3. Verify password
    let isPasswordValid: boolean;
    isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return err('UNAUTHORIZED');
    }

    // 4. Get person data
    const person = await this.personRepository.findById(user.idPeople.toString());
    if (!person) {
      return err('NOT_FOUND');
    }

    // 5. Generate JWT token
    const payload = {
      sub: user.id,
      username: user.username,
      profile: user.profile,
      personId: person.id,
      fgp: crypto.createHash('sha256').update(fingerprint).digest('hex'),
    };
    const token = this.jwtService.sign(payload);

    return ok(LoginMapper.toResultDto(token, user, person, companyStatus));
  }
}
