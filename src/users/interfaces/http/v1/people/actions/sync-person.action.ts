import {
  Controller,
  Post,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { PersonEntity } from '@users/infrastructure/repositories/entities/person.entity';
import { DniLookupService } from '@users/application/services/dni-lookup.service';

@ApiTags('Person')
@ApiBearerAuth()
@Controller('api/v1/person')
export class SyncPersonAction {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dniLookupService: DniLookupService,
  ) {}

  @Post(':documentNumber/sync-reniec')
  @ApiOperation({
    summary: 'Sincronizar nombres oficiales de RENIEC para clientes con is_synced = false',
  })
  @ApiResponse({ status: 200, description: 'Cliente sincronizado exitosamente.' })
  async execute(@Param('documentNumber') documentNumber: string) {
    if (!/^\d{8}$/.test(documentNumber)) {
      throw new BadRequestException('El DNI debe tener exactamente 8 dígitos.');
    }

    const personRepo = this.dataSource.getRepository(PersonEntity);
    const person = await personRepo.findOne({
      where: { documentNumber },
    });

    if (!person) {
      throw new NotFoundException('Persona no encontrada en el sistema.');
    }

    // Consultar APIs externas en cadena mediante DniLookupService
    const lookupResult = await this.dniLookupService.lookupExternal(documentNumber);

    if (!lookupResult) {
      throw new BadRequestException(
        'No se pudo obtener información de RENIEC en este momento (tokens agotados o servicio no disponible).',
      );
    }

    const fullName = `${lookupResult.apellidoPaterno} ${lookupResult.apellidoMaterno}`.trim();
    person.firstName = lookupResult.nombres;
    person.lastName = fullName;
    person.isSynced = true;

    await personRepo.save(person);

    return {
      success: true,
      message: 'Datos de RENIEC sincronizados correctamente.',
      person: {
        documentNumber: person.documentNumber,
        firstName: person.firstName,
        lastName: person.lastName,
        isSynced: true,
      },
    };
  }
}
