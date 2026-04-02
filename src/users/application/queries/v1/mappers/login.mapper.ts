import { User } from '../../../../domain/entities/user.entity';
import { Person } from '../../../../domain/entities/person.entity';
import { LoginResultDto } from '../dto/login-result.dto';

export class LoginMapper {
  static toResultDto(
    token: string,
    user: User,
    person: Person,
    companyStatus?: string,
  ): LoginResultDto {
    return {
      token,
      user: {
        id: user.id!,
        username: user.username,
        profile: user.profile,
        status: user.status,
        isDayClosed: user.isDayClosed,
        idCompany: user.idCompany,
        companyStatus,
        collectionOrder: user.collectionOrder,
        person: {
          id: person.id!,
          documentType: person.documentType,
          documentNumber: person.documentNumber,
          firstName: person.firstName,
          lastName: person.lastName,
          birthday: person.birthday,
        },
      },
    };
  }
}
