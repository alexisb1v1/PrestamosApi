import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Valores por defecto basados en nuestro diccionario para evitar exponer "leaks" del sistema
    let errorCode = 'UNEXPECTED_ERROR';
    let errorMessage = 'Error inesperado del servidor';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        
        // 1. Errores formateados internamente por nosotros via matchResult ({ errorCode, message })
        if (resObj.errorCode) {
          errorCode = resObj.errorCode;
          errorMessage = resObj.message;
        } 
        // 2. Errores lanzados por Validadores automáticos de NestJS (class-validator)
        else if (resObj.message) {
          errorCode = status === 400 ? 'INVALID_INPUT' : 'HTTP_ERROR';
          errorMessage = Array.isArray(resObj.message) ? resObj.message[0] : resObj.message;
        }
      } else if (typeof exceptionResponse === 'string') {
        errorCode = 'HTTP_ERROR';
        errorMessage = exceptionResponse;
      }
    } else {
      // 3. Excepciones de red, base de datos o sintaxis (500)
      // Mantenemos el UNEXPECTED_ERROR encubierto pero lo registramos en logs reales del servidor
      console.error('Unhandled System Exception:', exception);
    }

    // Estructura limpia y estricta definida
    const errorResponse = {
      statusCode: status,
      errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
