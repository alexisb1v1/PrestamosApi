import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleDayStatusDto {
  @ApiProperty({ example: true, description: 'New status for isDayClosed' })
  @IsNotEmpty()
  @IsBoolean()
  isDayClosed: boolean;
}
