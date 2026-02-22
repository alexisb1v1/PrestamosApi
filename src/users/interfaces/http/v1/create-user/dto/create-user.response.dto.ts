import { ApiProperty } from '@nestjs/swagger';

export class CreateUserResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'User and Person created successfully',
    description: 'Message describing the result',
  })
  message: string;

  @ApiProperty({
    example: '123',
    description: 'ID of the created user',
    required: false,
  })
  userId?: string;

  constructor(success: boolean, message: string, userId?: string) {
    this.success = success;
    this.message = message;
    this.userId = userId;
  }
}
