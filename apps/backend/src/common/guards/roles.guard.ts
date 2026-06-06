// RolesGuard проверяет RBAC на уровне REST API.
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Читаем роли из @Roles(...) у метода controller'а или у всего controller'а.
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) ?? [];

    // Если @Roles не указан, endpoint считается открытым с точки зрения RBAC.
    if (requiredRoles.length === 0) return true;

    // request.user заполняется JwtStrategy после успешной JWT-аутентификации.
    const request = context.switchToHttp().getRequest<{ user?: { roles?: Role[] } }>();
    return requiredRoles.some((role) => request.user?.roles?.includes(role));
  }
}
