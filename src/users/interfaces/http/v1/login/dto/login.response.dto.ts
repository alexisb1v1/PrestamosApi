import { ApiProperty } from '@nestjs/swagger';

class PersonDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    documentType: string;

    @ApiProperty()
    documentNumber: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    birthday: Date;
}

class UserDataDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    profile: string;

    @ApiProperty()
    status: string;

    @ApiProperty({ type: PersonDto })
    person: PersonDto;

    @ApiProperty()
    isDayClosed: boolean;

    @ApiProperty({ required: false })
    idCompany?: string;

    @ApiProperty({ required: false })
    companyStatus?: string;
}

export class LoginResponseDto {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty({ description: 'JWT access token', required: false })
    token?: string;

    @ApiProperty({ type: UserDataDto, required: false })
    user?: UserDataDto;

    constructor(success: boolean, message: string, token?: string, user?: any) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.user = user;
    }
}
