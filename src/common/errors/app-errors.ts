export interface ErrorDetail {
  statusCode: number;
  errorCode: string;
  message: string;
}

export const ERROR_CODES = {
  // --- GENERAL (GEN) ---
  UNEXPECTED_ERROR: {
    statusCode: 500,
    errorCode: 'GEN_001',
    message: 'Error inesperado del servidor',
  },
  INVALID_INPUT: {
    statusCode: 400,
    errorCode: 'GEN_002',
    message: 'Los datos ingresados son inválidos',
  },
  UNAUTHORIZED: {
    statusCode: 401,
    errorCode: 'GEN_003',
    message: 'No autorizado',
  },
  FORBIDDEN: {
    statusCode: 403,
    errorCode: 'GEN_004',
    message: 'No tiene permisos para realizar esta acción',
  },
  NOT_FOUND: {
    statusCode: 404,
    errorCode: 'GEN_005',
    message: 'El recurso solicitado no fue encontrado',
  },

  // --- USUARIOS / PERSONAS (USR) ---
  USER_NOT_FOUND: {
    statusCode: 404,
    errorCode: 'USR_001',
    message: 'El usuario no existe',
  },
  PERSON_NOT_FOUND: {
    statusCode: 404,
    errorCode: 'USR_002',
    message: 'La ficha personal no existe',
  },
  USER_ALREADY_EXISTS: {
    statusCode: 400,
    errorCode: 'USR_003',
    message: 'El nombre de usuario ya está en uso',
  },
  PERSON_ALREADY_EXISTS: {
    statusCode: 400,
    errorCode: 'USR_004',
    message: 'La persona ya está registrada con ese documento',
  },

  // --- PRÉSTAMOS (LOA) ---
  LOAN_NOT_FOUND: {
    statusCode: 404,
    errorCode: 'LOA_001',
    message: 'El préstamo solicitado no existe',
  },
  LOAN_ALREADY_ACTIVE: {
    statusCode: 400,
    errorCode: 'LOA_002',
    message: 'La persona ya tiene un préstamo activo en curso',
  },
  LOAN_INVALID_DAYS: {
    statusCode: 400,
    errorCode: 'LOA_003',
    message: 'El plazo solicitado no cumple con el mínimo requerido (24 días)',
  },
  LOAN_CANNOT_PAY_TODAY: {
    statusCode: 400,
    errorCode: 'LOA_004',
    message: 'El préstamo no puede aceptar pagos en la fecha actual',
  },
  INSTALLMENT_NOT_FOUND: {
    statusCode: 404,
    errorCode: 'LOA_005',
    message: 'La cuota o pago no fue encontrado',
  },

  // --- EMPRESAS (COM) ---
  COMPANY_NOT_FOUND: {
    statusCode: 404,
    errorCode: 'COM_001',
    message: 'La empresa solicitada no existe',
  },
  COMPANY_INACTIVE: {
    statusCode: 403,
    errorCode: 'COM_002',
    message: 'La empresa se encuentra inactiva o bloqueada',
  },

  // --- GASTOS (EXP) ---
  EXPENSE_NOT_FOUND: {
    statusCode: 404,
    errorCode: 'EXP_001',
    message: 'El gasto solicitado no existe',
  },
} as const;

export type AppError = keyof typeof ERROR_CODES;
