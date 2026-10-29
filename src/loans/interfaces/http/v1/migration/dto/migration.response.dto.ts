import { Expose, Type } from 'class-transformer';

export class MigrationLoanItemDto {
  @Expose()
  codigoRef: string;

  @Expose()
  dniCliente: string;

  @Expose()
  nombresApellidos: string;

  @Expose()
  telefono: string;

  @Expose()
  direccion: string;

  @Expose()
  montoPrestado: number;

  @Expose()
  interesPorcentaje: number;

  @Expose()
  totalPagar: number;

  @Expose()
  numeroCuotas: number;

  @Expose()
  valorCuota: number;

  @Expose()
  fechaInicio: string;

  @Expose()
  cuotasPagadas: number;

  @Expose()
  cobradorUsuario: string;

  @Expose()
  cobradorId?: string;

  @Expose()
  amortizadoCalculado: number;

  @Expose()
  saldoPendiente: number;

  @Expose()
  statusResultante: 'Activo' | 'Liquidado';

  @Expose()
  isExistingClient: boolean;

  @Expose()
  isValid: boolean;

  @Expose()
  errors: string[];
}

export class MigrationPaymentItemDto {
  @Expose()
  codigoRef: string;

  @Expose()
  fechaPago: string;

  @Expose()
  montoAbonado: number;

  @Expose()
  metodoPago: 'EFECTIVO' | 'YAPE';

  @Expose()
  isValid: boolean;

  @Expose()
  errors: string[];
}

export class CollectorMappingOptionDto {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  fullName: string;
}

export class MigrationPreviewResponseDto {
  @Expose()
  totalLoans: number;

  @Expose()
  validLoansCount: number;

  @Expose()
  warningLoansCount: number;

  @Expose()
  errorLoansCount: number;

  @Expose()
  totalPayments: number;

  @Expose()
  validPaymentsCount: number;

  @Expose()
  errorPaymentsCount: number;

  @Expose()
  hasPaymentsSheet: boolean;

  @Expose()
  @Type(() => MigrationLoanItemDto)
  loans: MigrationLoanItemDto[];

  @Expose()
  @Type(() => MigrationPaymentItemDto)
  payments: MigrationPaymentItemDto[];

  @Expose()
  @Type(() => CollectorMappingOptionDto)
  availableCollectors: CollectorMappingOptionDto[];

  @Expose()
  unmappedCollectors: string[];
}

export class MigrationExecuteResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  migratedLoansCount: number;

  @Expose()
  migratedPaymentsCount: number;

  @Expose()
  message: string;
}

