import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'jdoe', description: 'Username' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @ApiProperty({
    example: 'mySecurePassword123',
    description: 'Plain text password (will be hashed server-side)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'ADMIN', description: 'User Profile' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  profile: string;

  // Person data
  @ApiProperty({ example: 'CC', description: 'Document Type' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  documentType: string;

  @ApiProperty({ example: '1234567890', description: 'Document Number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  documentNumber: string;

  @ApiProperty({ example: 'John', description: 'First Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '1990-01-01', description: 'Birthday' })
  @IsDateString()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({ example: '1', description: 'Company ID', required: false })
  @IsString()
  @IsOptional()
  idCompany?: string;
}
