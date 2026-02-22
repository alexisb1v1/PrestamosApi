import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'mySecurePassword',
    description: 'Plain text password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
