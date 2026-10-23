import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';
import { IS_PUBLIC_KEY } from './public.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  CompanyRepository,
  CompanyRepositoryToken,
} from '@companies/domain/repositories/company.repository';
import { Company } from '@companies/domain/entities/company.entity';
import { Redis } from 'ioredis';

interface RequestWithUser extends Request {
  user: JwtPayload;
  company?: Company;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
    @Inject(CompanyRepositoryToken)
    private readonly companyRepository: CompanyRepository,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 2. Validate Fingerprint
      const fingerprint = request.headers['x-fingerprint'] as string;
      if (!this.isValidFingerprint(fingerprint, payload.fgp)) {
        throw new UnauthorizedException('Invalid device fingerprint');
      }

      // 3. Validate Composite Key and Tenant Kill-Switch with Redis Cache
      // El perfil OWNER es el Superadministrador de la plataforma (accede por "central", idCompany = 0 o null)
      // y NO está atado a un tenant cliente ni sujeto al Kill-Switch de un tenant.
      const isOwner =
        payload.profile === 'OWNER' ||
        String(payload.companyId) === '0' ||
        !payload.companyId;

      if (isOwner) {
        // Inyectamos una instancia virtual de Company para el OWNER con todos los privilegios activos
        request.company = new Company(
          'Administración Central NeoCobros',
          'ACTIVE',
          new Date(),
          '0',
          'CENTRAL',
          'central',
          'system_owner_key',
          { features: { risk_scoring: true, customer_report: true } },
        );
      } else if (payload.companyId) {
        if (!payload.keyToken) {
          throw new UnauthorizedException(
            'Token inválido: falta la llave del tenant',
          );
        }

        const redisKey = `neocobros:tenant:auth:${payload.companyId}`;
        let cachedCompany: any = null;

        try {
          const cachedRaw = await this.redis.get(redisKey);
          if (cachedRaw) {
            cachedCompany = JSON.parse(cachedRaw);
          }
        } catch {
          // En caso de incidencia transitoria en Redis, fallback directo a PostgreSQL
        }

        let company: Company | null = null;

        if (cachedCompany) {
          // Cache Hit (< 0.1 ms en RAM)
          if (
            cachedCompany.keyToken !== payload.keyToken ||
            cachedCompany.status !== 'ACTIVE'
          ) {
            throw new UnauthorizedException(
              'Empresa inactiva o credenciales de tenant revocadas',
            );
          }

          company = new Company(
            cachedCompany.companyName,
            cachedCompany.status,
            new Date(),
            cachedCompany.id,
            undefined,
            cachedCompany.subdomain,
            cachedCompany.keyToken,
            cachedCompany.settings,
          );
        } else {
          // Cache Miss -> Consulta a PostgreSQL
          company = await this.companyRepository.findByIdAndKeyToken(
            String(payload.companyId),
            String(payload.keyToken),
          );

          if (!company || company.getNormalizedStatus() !== 'ACTIVE') {
            throw new UnauthorizedException(
              'Empresa inactiva o credenciales de tenant revocadas',
            );
          }

          // Guardar en Redis por 10 minutos (600s)
          try {
            await this.redis.set(
              redisKey,
              JSON.stringify({
                id: company.id,
                companyName: company.companyName,
                subdomain: company.subdomain,
                status: company.getNormalizedStatus(),
                settings: company.settings,
                keyToken: company.keyToken,
              }),
              'EX',
              600,
            );
          } catch {
            // Silencioso ante errores de Redis
          }
        }

        request.company = company;
      }

      // We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request.user = payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private isValidFingerprint(fingerprint: string, hash: string): boolean {
    if (!fingerprint || !hash) return false;
    const computedHash = crypto
      .createHash('sha256')
      .update(fingerprint)
      .digest('hex');
    return computedHash === hash;
  }
}
