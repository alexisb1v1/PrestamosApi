import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExecuteLoanItemRequestDto {
  @IsString()
  @IsNotEmpty()
  codigoRef: string;

  @IsString()
  @IsNotEmpty()
  dniCliente: string;

  @IsString()
  @IsNotEmpty()
  nombresApellidos: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsNumber()
  montoPrestado: number;

  @IsNumber()
  interesPorcentaje: number;

  @IsNumber()
  totalPagar: number;

  @IsNumber()
  numeroCuotas: number;

  @IsNumber()
  valorCuota: number;

  @IsString()
  @IsNotEmpty()
  fechaInicio: string;

  @IsNumber()
  cuotasPagadas: number;

  @IsString()
  @IsNotEmpty()
  cobradorId: string;
}

export class ExecutePaymentItemRequestDto {
  @IsString()
  @IsNotEmpty()
  codigoRef: string;

  @IsString()
  @IsNotEmpty()
  fechaPago: string;

  @IsNumber()
  montoAbonado: number;

  @IsString()
  @IsNotEmpty()
  metodoPago: 'EFECTIVO' | 'YAPE';
}

export class ExecuteMigrationRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'El id de la compañía es obligatorio para la migración.' })
  companyId: string;

  @IsBoolean()
  hasPaymentsSheet: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExecuteLoanItemRequestDto)
  loans: ExecuteLoanItemRequestDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExecutePaymentItemRequestDto)
  payments: ExecutePaymentItemRequestDto[];
}

