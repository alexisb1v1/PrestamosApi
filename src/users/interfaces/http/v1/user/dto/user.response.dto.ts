import { ApiProperty } from '@nestjs/swagger';
import { UserAppDto } from '@users/application/queries/v1/dto/user-app.dto';

export class UserResponseDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ example: '******' })
  passwordHash: string;

  @ApiProperty()
  profile: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  idPeople: number;

  @ApiProperty()
  isDayClosed: boolean;

  @ApiProperty()
  documentType?: string;

  @ApiProperty()
  documentNumber?: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  lastName?: string;

  @ApiProperty()
  birthday: Date | null;

  @ApiProperty()
  idCompany?: string;

  constructor(user: UserAppDto) {
    this.id = user.id;
    this.username = user.username;
    this.passwordHash = '******';
    this.profile = user.profile;
    this.status = user.status;
    this.idPeople = user.idPeople;
    this.isDayClosed = user.isDayClosed;

    if (user.person) {
      this.documentType = user.person.documentType;
      this.documentNumber = user.person.documentNumber;
      this.firstName = user.person.firstName;
      this.lastName = user.person.lastName;
      this.birthday = user.person.birthday;
    }

    this.idCompany = user.idCompany;
  }
}
