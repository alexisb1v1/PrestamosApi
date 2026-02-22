import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class ReassignLoanDto {
    @ApiProperty({ example: 1, description: 'ID of the new user to assign the loan to' })
    @IsNumber()
    @IsNotEmpty()
    newUserId: number;
}
