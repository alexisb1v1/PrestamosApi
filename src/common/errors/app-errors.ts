export type AppError =
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'UNEXPECTED_ERROR';

export const AppErrorMessages: Record<AppError, string> = {
  NOT_FOUND: 'El recurso solicitado no fue encontrado',
  ALREADY_EXISTS: 'El recurso ya existe',
  INVALID_INPUT: 'Los datos ingresados son inválidos',
  UNAUTHORIZED: 'No autorizado',
  FORBIDDEN: 'No tiene permisos para realizar esta acción',
  UNEXPECTED_ERROR: 'Error inesperado del servidor',
};
