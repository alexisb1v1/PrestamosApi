import { HttpException, HttpStatus } from '@nestjs/common';
import { Result } from 'neverthrow';
import { AppError, ERROR_CODES } from '../errors/app-errors';

/**
 * Centraliza el mapeo de AppError → HttpException usando el diccionario ERROR_CODES.
 * El controller solo necesita definir el caso de éxito (onSuccess).
 *
 * @param result    Result<T, AppError> devuelto por el handler
 * @param onSuccess Función que transforma el valor exitoso en la respuesta HTTP
 * @param messages  (Opcional) Mensajes personalizados para sobrescribir el diccionario
 */
export function matchResult<T, R>(
  result: Result<T, AppError>,
  onSuccess: (data: T) => R,
  messages?: Partial<Record<AppError, string>>,
): R {
  return result.match(onSuccess, (errorKey) => {
    const errorDetail = ERROR_CODES[errorKey];

    // Si no existe en el diccionario (por seguridad), lanzamos un 500 genérico
    if (!errorDetail) {
      throw new HttpException(
        {
          errorCode: 'GEN_001',
          message: 'Error inesperado del servidor',
          originalKey: errorKey,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const payload = {
      errorCode: errorDetail.errorCode,
      message: messages?.[errorKey] ?? errorDetail.message,
    };

    throw new HttpException(payload, errorDetail.statusCode);
  });
}
