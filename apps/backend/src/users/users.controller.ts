// UsersController — API административного управления участниками.
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/roles';
import { UserAccount, UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Создавать участников могут только административные роли.
  @Post() @Roles(Role.SUPER_ADMIN, Role.FEDERAL_CHAMBER_ADMIN, Role.REGIONAL_CHAMBER_ADMIN) create(@Body() dto: Omit<UserAccount, 'id' | 'active'>): UserAccount { return this.users.create(dto); }

  // Отзыв пользователя доступен верхним администраторам.
  @Post(':id/revoke') @Roles(Role.SUPER_ADMIN, Role.FEDERAL_CHAMBER_ADMIN) revoke(@Param('id') id: string): { revoked: boolean } { this.users.revoke(id); return { revoked: true }; }

  @Get() @Roles(Role.SUPER_ADMIN, Role.FEDERAL_CHAMBER_ADMIN, Role.REGIONAL_CHAMBER_ADMIN) list(): UserAccount[] { return this.users.list(); }
}
