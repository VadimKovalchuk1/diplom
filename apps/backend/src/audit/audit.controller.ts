// AuditController предоставляет endpoint для просмотра audit logs.
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/roles';
import { AuditEntry, AuditService } from './audit.service';

@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  // Смотреть аудит могут только роли контроля и администрирования.
  @Get() @Roles(Role.AUDITOR, Role.SUPER_ADMIN, Role.FEDERAL_CHAMBER_ADMIN) list(): AuditEntry[] { return this.audit.list(); }
}
