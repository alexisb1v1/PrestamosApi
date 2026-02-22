import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The UUID of the created loan application',
  })
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
