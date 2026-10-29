import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { matchResult } from '@shared/http/match-result';
import { LoanMigrationService } from '@loans/application/services/loan-migration.service';
import {
  MigrationPreviewResponseDto,
  MigrationExecuteResponseDto,
} from '../dto/migration.response.dto';
import { ExecuteMigrationRequestDto } from '../dto/migration.request.dto';

@ApiTags('Loan Migration')
@ApiBearerAuth()
@Controller('api/v1/loans/migration')
export class LoanMigrationAction {
  constructor(private readonly migrationService: LoanMigrationService) {}

  @Post('preview')
  @ApiOperation({
    summary: 'Previsualización y validación en memoria de cartera masiva (Excel)',
    description:
      'Parsea el libro Excel (.xlsx) con 2 hojas (PRESTAMOS y PAGOS), ejecuta validación cruzada y retorna el semáforo sin alterar la base de datos.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: MigrationPreviewResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
          return cb(
            new BadRequestException(
              'Formato de archivo inválido. Solo se admiten archivos Excel (.xlsx o .xls).',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<MigrationPreviewResponseDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Debe subir un archivo Excel válido');
    }

    const effectiveCompanyId = req.body?.companyId || req.user?.companyId;
    const result = await this.migrationService.generatePreview(file.buffer, effectiveCompanyId);
    return matchResult(result, (data) => data);
  }

  @Post('execute')
  @ApiOperation({
    summary: 'Ejecución transaccional de importación masiva de cartera',
    description:
      'Inserta préstamos y abonos de forma atómica (ACID). Los abonos pasados llevan is_migrated = true para no afectar el balance diario de caja.',
  })
  @ApiResponse({ status: 200, type: MigrationExecuteResponseDto })
  async execute(
    @Body() dto: ExecuteMigrationRequestDto,
    @Req() req: any,
  ): Promise<MigrationExecuteResponseDto> {
    const effectiveCompanyId = dto.companyId || req.user?.companyId;
    if (!effectiveCompanyId) {
      throw new BadRequestException('No se especificó la compañía de destino para la migración.');
    }
    const result = await this.migrationService.executeMigration(dto, effectiveCompanyId);
    return matchResult(result, (data) => data);
  }
}

