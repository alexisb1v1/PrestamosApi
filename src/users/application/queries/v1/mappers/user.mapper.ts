import { User } from '@users/domain/entities/user.entity';
import { Person } from '@users/domain/entities/person.entity';
import {
  UserAppDto,
  PersonAppDto,
  GetUserResultDto,
} from '../dto/user-app.dto';

export class UserMapper {
  static toPersonAppDto(person: Person): PersonAppDto {
    return {
      id: person.id,
      documentType: person.documentType,
      documentNumber: person.documentNumber,
      firstName: person.firstName,
      lastName: person.lastName,
      birthday: person.birthday,
    };
  }

  static toUserAppDto(user: User): UserAppDto {
    return {
      id: user.id,
      username: user.username,
      profile: user.profile,
      status: user.status,
      idPeople: user.idPeople,
      isDayClosed: user.isDayClosed,
      idCompany: user.idCompany,
      person: user.person ? this.toPersonAppDto(user.person) : undefined,
    };
  }

  static toGetUserResult(user: User, person?: Person): GetUserResultDto {
    return {
      user: this.toUserAppDto(user),
      person: person ? this.toPersonAppDto(person) : undefined,
    };
  }
}
