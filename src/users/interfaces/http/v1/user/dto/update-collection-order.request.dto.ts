import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCollectionOrderDto {
  @ApiProperty({
    example: ['1', '2', '3'],
    description: 'Array of loan IDs in the desired order',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  collectionOrder: string[];
}
