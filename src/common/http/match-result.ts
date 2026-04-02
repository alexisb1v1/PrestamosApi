import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Result } from 'neverthrow';
import { AppError, AppErrorMessages } from '../errors/app-errors';

/**
 * Centraliza el mapeo de AppError → HttpException.
 * El controller solo necesita definir el caso de éxito (onSuccess).
 *
 * @param result    Result<T, AppError> devuelto por el handler
 * @param onSuccess Función que transforma el valor exitoso en la respuesta HTTP
 * @param messages  (Opcional) Mensajes personalizados por código de error
 */
export function matchResult<T>(
  result: Result<T, AppError>,
  onSuccess: (data: T) => any,
  messages?: Partial<Record<AppError, string>>,
): any {
  return result.match(onSuccess, (error) => {
    const msg = messages?.[error] ?? AppErrorMessages[error];
    const payload = { errorCode: error, message: msg };
    switch (error) {
      case 'NOT_FOUND':
        throw new NotFoundException(payload);
      case 'ALREADY_EXISTS':
        throw new BadRequestException(payload);
      case 'UNAUTHORIZED':
        throw new UnauthorizedException(payload);
      case 'FORBIDDEN':
        throw new ForbiddenException(payload);
      case 'INVALID_INPUT':
        throw new BadRequestException(payload);
      case 'UNEXPECTED_ERROR':
      default:
        throw new InternalServerErrorException(payload);
    }
  });
}
