import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'MiClaveActual123',
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'MiNuevaClaveSegura123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword: string;
}
