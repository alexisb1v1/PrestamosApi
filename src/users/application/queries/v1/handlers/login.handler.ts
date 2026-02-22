import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { LoginQuery } from '../login.query';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { PersonRepository } from '../../../../domain/repositories/person.repository';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '../../../../../companies/domain/repositories/company.repository';

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
      isDayClosed: boolean;
      idCompany?: string;
      companyStatus?: string;
      person: {
        id: string;
        documentType: string;
        documentNumber: string;
        firstName: string;
        lastName: string;
        birthday?: Date;
      };
    },
  ) {}
}

@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery, LoginResult> {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(query: LoginQuery): Promise<LoginResult> {
    try {
      const { username, password } = query;

      // 1. Find user by username
      const user = await this.userRepository.findByUsername(username);

      if (!user) {
        return new LoginResult(false, 'Contraseña o usuario incorrecto');
      }

      if (user.status !== 'ACTIVE') {
        return new LoginResult(false, 'Usuario inactivo');
      }

      // 2. Verify password - Lazy Migration Strategy
      const storedHash = user.passwordHash;
      const isBcryptHash =
        storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$');

      let isPasswordValid: boolean;

      if (isBcryptHash) {
        // Modern path: compare using bcrypt
        isPasswordValid = await bcrypt.compare(password, storedHash);
      } else {
        // Legacy path: plain text comparison (old users)
        isPasswordValid = storedHash === password;

        if (isPasswordValid) {
          // Migrate: re-hash with bcrypt and update in DB silently
          const newHash = await bcrypt.hash(password, 10);
          await this.userRepository.updatePasswordHash(user.id!, newHash);
        }
      }

      if (!isPasswordValid) {
        return new LoginResult(false, 'Contraseña o usuario incorrecto');
      }

      // 3. Get person data
      const person = await this.personRepository.findById(
        user.idPeople.toString(),
      );

      if (!person) {
        return new LoginResult(false, 'Datos del usuario incompletos');
      }

      // 4. Generate JWT token
      const payload = {
        sub: user.id,
        username: user.username,
        profile: user.profile,
        personId: person.id,
      };

      const token = this.jwtService.sign(payload);

      // 5. Get Company Status if idCompany exists
      let companyStatus: string | undefined;
      if (user.idCompany) {
        const company = await this.companyRepository.findById(user.idCompany);
        if (company) {
          companyStatus = company.status;
        }
      }

      // 6. Return user with person data and token
      return new LoginResult(true, 'Login exitoso', token, {
        id: user.id!,
        username: user.username,
        profile: user.profile,
        status: user.status,
        isDayClosed: user.isDayClosed,
        idCompany: user.idCompany,
        companyStatus: companyStatus,
        person: {
          id: person.id!,
          documentType: person.documentType,
          documentNumber: person.documentNumber,
          firstName: person.firstName,
          lastName: person.lastName,
          birthday: person.birthday,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return new LoginResult(false, `Login fallido: ${errorMessage}`);
    }
  }
}
