// Декоратор @Roles(...) позволяет указать, какие роли имеют доступ к endpoint'у.
import { SetMetadata } from '@nestjs/common';
import { Role } from '../roles';

// ROLES_KEY — ключ metadata, по которому RolesGuard потом найдёт список ролей.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]): ReturnType<typeof SetMetadata> => SetMetadata(ROLES_KEY, roles);
