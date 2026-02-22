import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'ADMIN' })
  profile?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  status?: string;

  @ApiPropertyOptional({ example: 'DNI' })
  documentType?: string;

  @ApiPropertyOptional({ example: '12345678' })
  documentNumber?: string;

  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional()
  birthday?: Date;
}
