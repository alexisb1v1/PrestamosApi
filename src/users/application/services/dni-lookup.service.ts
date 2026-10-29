import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PersonRepository } from '@users/domain/repositories/person.repository';
import { Person } from '@users/domain/entities/person.entity';

export interface DniLookupResult {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

@Injectable()
export class DniLookupService {
  private readonly logger = new Logger(DniLookupService.name);

  constructor(
    @Inject(PersonRepository)
    private readonly personRepository: PersonRepository,
  ) {}

  /**
   * Consulta las APIs externas en cadena sin alterar directamente la base de datos.
   */
  async lookupExternal(dni: string): Promise<DniLookupResult | null> {
    let result = await this.searchDecolecta(dni);
    if (!result) {
      result = await this.searchApiPeruDev(dni);
    }
    if (!result) {
      result = await this.searchFactiliza(dni);
    }
    return result;
  }

  /**
   * Busca un documento en proveedores externos en cadena.
   * Si lo encuentra, crea la entidad Person, la guarda en BD (Caché) y la retorna.
   * NOTA: La búsqueda local ya la realiza el handler previamente.
   */
  async findDni(documentType: string, documentNumber: string): Promise<Person | null> {
    // Iniciamos la cadena de búsqueda en APIs externas
    const result = await this.lookupExternal(documentNumber);

    // Si lo encontró en alguna API, lo guardamos en caché (BD) y retornamos la entidad Person
    if (result) {
      try {
        const fullName = `${result.apellidoPaterno} ${result.apellidoMaterno}`.trim();
        const initialDetail = Person.createInitialCreditScoreDetail();
        const newPerson = new Person(
          documentType,
          documentNumber,
          result.nombres,
          fullName,
          null,
          undefined,
          undefined,
          undefined,
          85,
          null,
          initialDetail,
        );
        
        // Guardamos y retornamos la entidad recuperada de la BD para asegurar que tenga el ID
        await this.personRepository.save(newPerson);
        this.logger.debug(`Documento ${documentNumber} guardado en BD local (Caché)`);
        
        // Retornamos la entidad tal cual la creamos (o si necesitas el ID exacto y tu save() no lo muta, 
        // podrías hacer otro findByDocument, pero la mayoría de ORMs mutan el objeto inyectándole el ID).
        const cachedPerson = await this.personRepository.findByDocument(documentType, documentNumber);
        return cachedPerson || newPerson;
      } catch (err) {
        this.logger.error(`Error guardando caché local para documento ${documentNumber}`, err);
      }
    }

    return null;
  }

  // --- PROVEEDOR 1: Decolecta ---
  private async searchDecolecta(dni: string): Promise<DniLookupResult | null> {
    try {
      const token = process.env.DECOLECTA_TOKEN;
      if (!token) return null;
      
      this.logger.debug(`Consultando decolecta para el DNI: ${dni}`);
      const response = await axios.get(`https://api.decolecta.com/v1/reniec/dni?numero=${dni}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      if (response.data && response.data.nombres) {
        return {
          nombres: response.data.nombres,
          apellidoPaterno: response.data.apellidoPaterno || response.data.apellido_paterno || '',
          apellidoMaterno: response.data.apellidoMaterno || response.data.apellido_materno || '',
        };
      }
    } catch (err) {
      this.logger.warn(`decolecta falló para el DNI ${dni} - Probando siguiente API...`);
    }
    return null;
  }

  // --- PROVEEDOR 2: Apiperu.dev ---
  private async searchApiPeruDev(dni: string): Promise<DniLookupResult | null> {
    try {
      const token = process.env.API_PERU_DEV_TOKEN;
      if (!token) return null;

      this.logger.debug(`Consultando apiperu.dev para el DNI: ${dni}`);
      const response = await axios.post(`https://api.apiperu.dev/dni`, 
        { dni },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          timeout: 5000,
        }
      );

      if (response.data && response.data.success && response.data.data) {
        return {
          nombres: response.data.data.nombres,
          apellidoPaterno: response.data.data.apellido_paterno,
          apellidoMaterno: response.data.data.apellido_materno,
        };
      }
    } catch (err) {
      this.logger.warn(`apiperu.dev falló para el DNI ${dni} - Probando siguiente API...`);
    }
    return null;
  }

  // --- PROVEEDOR 3: app.factiliza.com ---
  private async searchFactiliza(dni: string): Promise<DniLookupResult | null> {
    try {
      const token = process.env.FACTILIZA_TOKEN;
      if (!token) return null;

      this.logger.debug(`Consultando factiliza para el DNI: ${dni}`);
      const response = await axios.get(`https://api.factiliza.com/v1/dni/info/${dni}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      if (response.data && response.data.nombres) {
        return {
          nombres: response.data.nombres,
          apellidoPaterno: response.data.apellidoPaterno || response.data.apellido_paterno || '',
          apellidoMaterno: response.data.apellidoMaterno || response.data.apellido_materno || '',
        };
      }
    } catch (err) {
      this.logger.warn(`factiliza falló para el DNI ${dni} - Fin de la cadena de fallback.`);
    }
    return null;
  }
}
