import { Injectable, Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import * as XLSX from 'xlsx';
import { ok, err, Result } from 'neverthrow';
import { AppError } from '@shared/errors/app-errors';
import {
  MigrationPreviewResponseDto,
  MigrationLoanItemDto,
  MigrationPaymentItemDto,
  CollectorMappingOptionDto,
  MigrationExecuteResponseDto,
} from '@loans/interfaces/http/v1/migration/dto/migration.response.dto';
import { ExecuteMigrationRequestDto } from '@loans/interfaces/http/v1/migration/dto/migration.request.dto';
import { UserEntity } from '@users/infrastructure/repositories/entities/user.entity';
import { PersonEntity } from '@users/infrastructure/repositories/entities/person.entity';
import { LoanEntity } from '@loans/infrastructure/repositories/entities/loan.entity';
import { LoanInstallmentEntity } from '@loans/infrastructure/repositories/entities/loan-installment.entity';
import { Person } from '@users/domain/entities/person.entity';
import { normalizeDate } from '@loans/application/utils/workdays.util';

@Injectable()
export class LoanMigrationService {
  private readonly logger = new Logger(LoanMigrationService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Parsea y valida el archivo Excel en memoria sin modificar la base de datos.
   */
  async generatePreview(
    fileBuffer: Buffer,
    companyId: string,
  ): Promise<Result<MigrationPreviewResponseDto, AppError>> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

      // Identificar hojas (flexible con mayúsculas/minúsculas y acentos)
      const prestamosSheetName =
        workbook.SheetNames.find((s) =>
          s.trim().toUpperCase().includes('PRESTAMO'),
        ) || workbook.SheetNames[0];

      const pagosSheetName = workbook.SheetNames.find((s) =>
        s.trim().toUpperCase().includes('PAGO'),
      );

      if (!prestamosSheetName || !workbook.Sheets[prestamosSheetName]) {
        return err('MIGRATION_FILE_EMPTY');
      }

      // Obtener exclusivamente los usuarios con rol COBRADOR de la empresa
      const userRepo = this.dataSource.getRepository(UserEntity);
      const queryWhere: any = { 
        status: 'ACTIVE',
        profile: 'COBRADOR',
      };
      if (companyId) {
        queryWhere.idCompany = companyId;
      }

      const collectors = await userRepo.find({
        where: queryWhere,
        relations: ['person'],
      });

      // Asegurar unicidad estricta por ID
      const uniqueCollectorsMap = new Map<string, CollectorMappingOptionDto>();
      for (const c of collectors) {
        if (!uniqueCollectorsMap.has(c.id)) {
          uniqueCollectorsMap.set(c.id, {
            id: c.id,
            username: c.username,
            fullName: c.person
              ? `${c.person.firstName} ${c.person.lastName}`.trim()
              : c.username,
          });
        }
      }
      const availableCollectors = Array.from(uniqueCollectorsMap.values());

      // Parsear Hoja 1: PRESTAMOS
      const rawPrestamos: any[] = XLSX.utils.sheet_to_json(
        workbook.Sheets[prestamosSheetName],
        { defval: '' },
      );

      if (!rawPrestamos || rawPrestamos.length === 0) {
        return err('MIGRATION_FILE_EMPTY');
      }

      // Parsear Hoja 2: PAGOS (si existe)
      let rawPagos: any[] = [];
      let hasPaymentsSheet = false;
      if (pagosSheetName && workbook.Sheets[pagosSheetName]) {
        rawPagos = XLSX.utils.sheet_to_json(
          workbook.Sheets[pagosSheetName],
          { defval: '' },
        );
        hasPaymentsSheet = rawPagos.length > 0;
      }

      // Consultar clientes existentes por DNI para marcar warning de reutilización
      const dnis = rawPrestamos
        .map((r) => this.extractDni(r, ['DNI_CLIENTE', 'DNI', 'DOCUMENTO']))
        .filter((dni) => dni && dni.length === 8);

      const personRepo = this.dataSource.getRepository(PersonEntity);
      const existingPeople =
        dnis.length > 0
          ? await personRepo.find({
              where: { documentNumber: In(dnis) },
            })
          : [];
      const existingPeopleMap = new Map<string, PersonEntity>(
        existingPeople.map((p) => [p.documentNumber, p]),
      );

      // Procesar Hoja 2: Pagos agrupados por CODIGO_REF
      const paymentsByRef = new Map<string, MigrationPaymentItemDto[]>();
      const processedPayments: MigrationPaymentItemDto[] = [];

      for (const row of rawPagos) {
        const codigoRef = this.extractString(row, ['CODIGO_REF', 'CODIGO', 'PRESTAMO_ID', 'ID_PRESTAMO']).toUpperCase();
        const fechaPagoRaw = this.extractDate(row, ['FECHA_PAGO', 'FECHA', 'FECHA DE PAGO']);
        const montoAbonado = this.extractNumber(row, ['MONTO_ABONADO', 'MONTO', 'ABONO', 'IMPORTE']);
        const metodoPagoRaw = this.extractString(row, ['METODO_PAGO', 'METODO', 'TIPO_PAGO']).toUpperCase();

        const errors: string[] = [];
        if (!codigoRef) errors.push('Falta el CODIGO_REF del préstamo.');
        if (!fechaPagoRaw) errors.push('Fecha de pago inválida o vacía.');
        if (montoAbonado <= 0) errors.push('El monto abonado debe ser mayor a 0.');

        let metodoPago: 'EFECTIVO' | 'YAPE' = 'EFECTIVO';
        if (metodoPagoRaw === 'YAPE') {
          metodoPago = 'YAPE';
        } else if (!metodoPagoRaw || metodoPagoRaw === 'EFECTIVO') {
          metodoPago = 'EFECTIVO';
        } else {
          errors.push(`Método de pago '${metodoPagoRaw}' inválido. Solo se admite EFECTIVO o YAPE.`);
        }

        const paymentItem: MigrationPaymentItemDto = {
          codigoRef,
          fechaPago: fechaPagoRaw || '',
          montoAbonado,
          metodoPago,
          isValid: errors.length === 0,
          errors,
        };

        processedPayments.push(paymentItem);
        if (codigoRef) {
          if (!paymentsByRef.has(codigoRef)) paymentsByRef.set(codigoRef, []);
          paymentsByRef.get(codigoRef)!.push(paymentItem);
        }
      }

      // Procesar Hoja 1: Préstamos
      const processedLoans: MigrationLoanItemDto[] = [];
      const unmappedCollectorsSet = new Set<string>();
      const refSet = new Set<string>();

      for (const row of rawPrestamos) {
        const codigoRef = this.extractString(row, ['CODIGO_REF', 'CODIGO', 'ID', 'PRESTAMO_ID']).toUpperCase();
        const dniCliente = this.extractDni(row, ['DNI_CLIENTE', 'DNI', 'DOCUMENTO']);
        let nombresApellidos = this.extractString(row, ['NOMBRES_APELLIDOS', 'NOMBRES', 'CLIENTE']);
        const telefono = this.extractString(row, ['TELEFONO', 'CELULAR', 'PHONE']);
        const direccion = this.extractString(row, ['DIRECCION', 'DOMICILIO', 'ADDRESS']);
        const montoPrestado = this.extractNumber(row, ['MONTO_PRESTADO', 'MONTO', 'CAPITAL']);
        const interesPorcentaje = this.extractNumber(row, ['INTERES_PORCENTAJE', 'INTERES', 'TASA'], 20);
        let totalPagar = this.extractNumber(row, ['TOTAL_PAGAR', 'TOTAL']);
        if (totalPagar <= 0 && montoPrestado > 0) {
          totalPagar = Number((montoPrestado * (1 + interesPorcentaje / 100)).toFixed(2));
        }
        const numeroCuotas = this.extractNumber(row, ['NUMERO_CUOTAS', 'CUOTAS', 'DIAS', 'PLAZO'], 24);
        let valorCuota = this.extractNumber(row, ['VALOR_CUOTA', 'CUOTA_DIARIA', 'FEE']);
        if (valorCuota <= 0 && totalPagar > 0 && numeroCuotas > 0) {
          valorCuota = Number((totalPagar / numeroCuotas).toFixed(2));
        }
        const fechaInicio = this.extractDate(row, ['FECHA_INICIO', 'FECHA_DESEMBOLSO', 'FECHA']);
        const cuotasPagadas = this.extractNumber(row, ['CUOTAS_PAGADAS', 'PAGADAS', 'CUOTAS_COBRADAS'], 0);
        const cobradorUsuario = this.extractString(row, ['COBRADOR_USUARIO', 'COBRADOR', 'USUARIO']);

        const errors: string[] = [];

        if (!codigoRef) {
          errors.push('Falta el CODIGO_REF identificador.');
        } else if (refSet.has(codigoRef)) {
          errors.push(`El CODIGO_REF '${codigoRef}' está duplicado en la Hoja 1.`);
        } else {
          refSet.add(codigoRef);
        }

        if (!dniCliente || dniCliente.length !== 8 || !/^\d{8}$/.test(dniCliente)) {
          errors.push('El DNI debe tener exactamente 8 dígitos numéricos.');
        }

        // Si el cliente ya existe en la base de datos, autocompletar su nombre si vino vacío
        const existingPerson = existingPeopleMap.get(dniCliente);
        if (existingPerson) {
          if (!nombresApellidos || nombresApellidos.trim().length === 0) {
            nombresApellidos = `${existingPerson.firstName} ${existingPerson.lastName}`.trim();
          }
        } else {
          // Si es un cliente nuevo y no vino el nombre en el Excel, se autogenera nombre provisional para lazy sync
          if (!nombresApellidos || nombresApellidos.trim().length < 3) {
            nombresApellidos = `Cliente ${dniCliente}`;
          }
        }

        if (montoPrestado <= 0) errors.push('El monto prestado debe ser mayor a 0.');
        if (totalPagar <= montoPrestado) errors.push('El total a pagar debe ser mayor al capital prestado.');
        if (numeroCuotas <= 0) errors.push('El número de cuotas debe ser mayor a 0.');
        if (!fechaInicio) errors.push('Fecha de inicio inválida o ausente.');

        // Mapeo de cobrador
        let cobradorId: string | undefined = undefined;
        if (cobradorUsuario) {
          const match = availableCollectors.find(
            (c) =>
              c.username.toLowerCase() === cobradorUsuario.toLowerCase() ||
              c.fullName.toLowerCase().includes(cobradorUsuario.toLowerCase()),
          );
          if (match) {
            cobradorId = match.id;
          } else {
            unmappedCollectorsSet.add(cobradorUsuario);
            errors.push(`Cobrador '${cobradorUsuario}' no encontrado en los usuarios activos.`);
          }
        } else {
          if (availableCollectors.length === 1) {
            cobradorId = availableCollectors[0].id;
          } else {
            errors.push('Debe especificar un cobrador asignado.');
          }
        }

        // Cálculo de amortización y saldo
        let amortizadoCalculado = 0;
        if (hasPaymentsSheet && paymentsByRef.has(codigoRef)) {
          const pagos = paymentsByRef.get(codigoRef)!;
          amortizadoCalculado = pagos.reduce((sum, p) => sum + p.montoAbonado, 0);
          amortizadoCalculado = Number(amortizadoCalculado.toFixed(2));
        } else {
          if (cuotasPagadas > numeroCuotas) {
            errors.push(`Las cuotas pagadas (${cuotasPagadas}) superan el total (${numeroCuotas}).`);
          }
          amortizadoCalculado = Number((cuotasPagadas * valorCuota).toFixed(2));
        }

        if (amortizadoCalculado > totalPagar) {
          errors.push(`El total pagado (S/ ${amortizadoCalculado}) excede el total a pagar (S/ ${totalPagar}).`);
        }

        const saldoPendiente = Math.max(0, Number((totalPagar - amortizadoCalculado).toFixed(2)));
        const statusResultante: 'Activo' | 'Liquidado' =
          saldoPendiente <= 0 ? 'Liquidado' : 'Activo';

        processedLoans.push({
          codigoRef,
          dniCliente,
          nombresApellidos,
          telefono,
          direccion,
          montoPrestado,
          interesPorcentaje,
          totalPagar,
          numeroCuotas,
          valorCuota,
          fechaInicio: fechaInicio || '',
          cuotasPagadas,
          cobradorUsuario,
          cobradorId,
          amortizadoCalculado,
          saldoPendiente,
          statusResultante,
          isExistingClient: existingPeopleMap.has(dniCliente),
          isValid: errors.length === 0,
          errors,
        });
      }

      // Validar integridad referencial cruzada en Hoja 2 (códigos huérfanos)
      for (const pay of processedPayments) {
        if (pay.codigoRef && !refSet.has(pay.codigoRef)) {
          pay.isValid = false;
          pay.errors.push(`El CODIGO_REF '${pay.codigoRef}' no existe en la Hoja de Préstamos.`);
        }
      }

      const validLoansCount = processedLoans.filter((l) => l.isValid).length;
      const errorLoansCount = processedLoans.filter((l) => !l.isValid).length;
      const warningLoansCount = processedLoans.filter((l) => l.isValid && l.isExistingClient).length;

      const validPaymentsCount = processedPayments.filter((p) => p.isValid).length;
      const errorPaymentsCount = processedPayments.filter((p) => !p.isValid).length;

      const responseDto: MigrationPreviewResponseDto = {
        totalLoans: processedLoans.length,
        validLoansCount,
        warningLoansCount,
        errorLoansCount,
        totalPayments: processedPayments.length,
        validPaymentsCount,
        errorPaymentsCount,
        hasPaymentsSheet,
        loans: processedLoans,
        payments: processedPayments,
        availableCollectors,
        unmappedCollectors: Array.from(unmappedCollectorsSet),
      };

      return ok(responseDto);
    } catch (error: any) {
      this.logger.error(`Error generando preview de migración: ${error.message}`, error.stack);
      return err('MIGRATION_FILE_EMPTY');
    }
  }

  /**
   * Ejecuta la inserción transaccional de los préstamos y pagos validados.
   */
  async executeMigration(
    dto: ExecuteMigrationRequestDto,
    companyId: string,
  ): Promise<Result<MigrationExecuteResponseDto, AppError>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      let migratedLoansCount = 0;
      let migratedPaymentsCount = 0;

      // Agrupar pagos por codigoRef si vinieron en el DTO
      const paymentsByRef = new Map<string, typeof dto.payments>();
      if (dto.hasPaymentsSheet && dto.payments && dto.payments.length > 0) {
        for (const p of dto.payments) {
          const ref = p.codigoRef.toUpperCase();
          if (!paymentsByRef.has(ref)) paymentsByRef.set(ref, []);
          paymentsByRef.get(ref)!.push(p);
        }
      }

      for (const loanDto of dto.loans) {
        // 1. Resolver o Crear Persona (Titular del Préstamo)
        let person = await queryRunner.manager.findOne(PersonEntity, {
          where: { documentNumber: loanDto.dniCliente },
        });

        if (!person) {
          const hasProvidedName = loanDto.nombresApellidos && loanDto.nombresApellidos.trim().length >= 3;
          let firstName = 'Cliente';
          let lastName = loanDto.dniCliente;
          let isSynced = false;

          if (hasProvidedName) {
            const nameParts = loanDto.nombresApellidos.trim().split(/\s+/);
            firstName = nameParts[0] || 'Cliente';
            lastName = nameParts.slice(1).join(' ') || loanDto.dniCliente;
            // Si el nombre vino escrito en el Excel, se asume no verificado formalmente por RENIEC aún (isSynced = false)
            isSynced = false;
          }

          const newPerson = queryRunner.manager.create(PersonEntity, {
            documentType: 'DNI',
            documentNumber: loanDto.dniCliente,
            firstName,
            lastName,
            creditScore: 85,
            creditScoreDetail: Person.createInitialCreditScoreDetail() as any,
            isSynced,
          });
          person = await queryRunner.manager.save(PersonEntity, newPerson);
        }

        // 2. Determinar Fechas del Préstamo
        const startDate = new Date(loanDto.fechaInicio);
        const endDate = this.calculateEndDate(startDate, loanDto.numeroCuotas);

        // 3. Crear Préstamo
        const interestAmount = Number((loanDto.totalPagar - loanDto.montoPrestado).toFixed(2));

        const loan = queryRunner.manager.create(LoanEntity, {
          idPeople: person.id,
          idCompany: companyId,
          startDate: startDate,
          endDate: endDate,
          amount: loanDto.montoPrestado,
          interest: interestAmount,
          interestRate: loanDto.interesPorcentaje,
          fee: loanDto.valorCuota,
          days: loanDto.numeroCuotas,
          createdAt: startDate,
          userId: loanDto.cobradorId,
          status: 'Activo',
          address: loanDto.direccion || '',
          phone: loanDto.telefono || '',
          isMigrated: true,
          migratedAt: now,
        });

        const savedLoan = await queryRunner.manager.save(LoanEntity, loan);
        migratedLoansCount++;

        // 4. Inserción de Abonos / Cuotas en loan_installments
        let totalAmortizado = 0;
        let lastPaymentDate: Date | null = null;

        if (dto.hasPaymentsSheet && paymentsByRef.has(loanDto.codigoRef.toUpperCase())) {
          const pagos = paymentsByRef.get(loanDto.codigoRef.toUpperCase())!;
          for (const pay of pagos) {
            const pDate = new Date(pay.fechaPago);
            const installment = queryRunner.manager.create(LoanInstallmentEntity, {
              loanId: savedLoan.id,
              installmentDate: pDate,
              amount: pay.montoAbonado,
              status: 'PAID',
              userId: loanDto.cobradorId,
              paymentType: pay.metodoPago,
              isMigrated: true,
            });
            await queryRunner.manager.save(LoanInstallmentEntity, installment);
            totalAmortizado += pay.montoAbonado;
            migratedPaymentsCount++;
            if (!lastPaymentDate || pDate > lastPaymentDate) {
              lastPaymentDate = pDate;
            }
          }
        } else if (loanDto.cuotasPagadas > 0) {
          let currentDay = new Date(startDate);
          let generated = 0;

          while (generated < loanDto.cuotasPagadas) {
            if (currentDay.getDay() !== 0) {
              const instDate = new Date(currentDay);
              instDate.setHours(12, 0, 0, 0);

              const installment = queryRunner.manager.create(LoanInstallmentEntity, {
                loanId: savedLoan.id,
                installmentDate: instDate,
                amount: loanDto.valorCuota,
                status: 'PAID',
                userId: loanDto.cobradorId,
                paymentType: 'EFECTIVO',
                isMigrated: true,
              });
              await queryRunner.manager.save(LoanInstallmentEntity, installment);
              totalAmortizado += loanDto.valorCuota;
              migratedPaymentsCount++;
              lastPaymentDate = instDate;
              generated++;
            }
            currentDay.setDate(currentDay.getDate() + 1);
          }
        }

        // 5. Ajustar Estado si quedó Liquidado
        const saldoRestante = Number((loanDto.totalPagar - totalAmortizado).toFixed(2));
        if (saldoRestante <= 0) {
          savedLoan.status = 'Liquidado';
          savedLoan.liquidationDate = lastPaymentDate || now;
          savedLoan.completedOnTime = lastPaymentDate ? normalizeDate(lastPaymentDate) <= normalizeDate(endDate) : true;
          await queryRunner.manager.save(LoanEntity, savedLoan);
        }
      }

      await queryRunner.commitTransaction();

      return ok({
        success: true,
        migratedLoansCount,
        migratedPaymentsCount,
        message: `Migración exitosa: ${migratedLoansCount} préstamos y ${migratedPaymentsCount} pagos importados correctamente.`,
      });
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error ejecutando migración: ${error.message}`, error.stack);
      return err('MIGRATION_EXECUTE_ERROR');
    } finally {
      await queryRunner.release();
    }
  }

  // --- Helpers privados de extracción segura ---

  private extractDni(row: any, keys: string[]): string {
    const raw = this.extractString(row, keys);
    if (!raw) return '';
    // Limpiar caracteres no numéricos
    const clean = raw.replace(/\D/g, '');
    // Si Excel lo leyó como número y truncó los ceros a la izquierda (ej. 11926 en vez de 00011926)
    if (clean.length > 0 && clean.length <= 8) {
      return clean.padStart(8, '0');
    }
    return clean;
  }

  private extractString(row: any, keys: string[]): string {
    for (const key of keys) {
      for (const rowKey of Object.keys(row)) {
        if (rowKey.trim().toUpperCase() === key.toUpperCase() && row[rowKey] !== undefined && row[rowKey] !== null) {
          return String(row[rowKey]).trim();
        }
      }
    }
    return '';
  }

  private extractNumber(row: any, keys: string[], defaultValue = 0): number {
    const str = this.extractString(row, keys);
    if (!str) return defaultValue;
    const clean = str.replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? defaultValue : num;
  }

  private extractDate(row: any, keys: string[]): string | null {
    for (const key of keys) {
      for (const rowKey of Object.keys(row)) {
        if (rowKey.trim().toUpperCase() === key.toUpperCase()) {
          const val = row[rowKey];
          if (!val) return null;
          if (val instanceof Date) {
            return val.toISOString().split('T')[0];
          }
          if (typeof val === 'number') {
            const parsed = XLSX.SSF.parse_date_code(val);
            if (parsed) {
              const y = parsed.y;
              const m = String(parsed.m).padStart(2, '0');
              const d = String(parsed.d).padStart(2, '0');
              return `${y}-${m}-${d}`;
            }
          }
          const dStr = String(val).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(dStr)) {
            return dStr.split('T')[0];
          }
          if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dStr)) {
            const parts = dStr.split('/');
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            const y = parts[2];
            return `${y}-${m}-${d}`;
          }
        }
      }
    }
    return null;
  }

  private calculateEndDate(startDate: Date, daysCount: number): Date {
    const end = new Date(startDate);
    let counted = 0;
    while (counted < daysCount) {
      if (end.getDay() !== 0) {
        counted++;
      }
      if (counted < daysCount) {
        end.setDate(end.getDate() + 1);
      }
    }
    return end;
  }
}
