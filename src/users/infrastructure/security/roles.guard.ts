import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @Inject(UserRepository)
        private readonly userRepository: UserRepository,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user: jwtPayload } = context.switchToHttp().getRequest();

        if (!jwtPayload || !jwtPayload.sub) {
            throw new ForbiddenException('Token inválido o no proporcionado');
        }

        // Consultar el perfil real en la base de datos
        const user = await this.userRepository.findById(jwtPayload.sub);

        if (!user) {
            throw new ForbiddenException('Usuario no encontrado en la base de datos');
        }

        if (!requiredRoles.includes(user.profile)) {
            throw new ForbiddenException('No tienes permiso para realizar esta acción');
        }

        return true;
    }
}
