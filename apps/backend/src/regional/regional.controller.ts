// RegionalController — REST API для межрегиональных запросов.
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/roles';
import { RegionalRequest, RegionalService } from './regional.service';

@Controller('regional-requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RegionalController {
  constructor(private readonly regional: RegionalService) {}

  // Нотариус или региональный администратор может создать запрос в другую палату.
  @Post() @Roles(Role.NOTARY, Role.REGIONAL_CHAMBER_ADMIN) create(@Body() dto: Omit<RegionalRequest, 'id' | 'status' | 'createdAt'>): RegionalRequest { return this.regional.create(dto); }

  // Аудитор тоже может читать запросы для контроля маршрутизации.
  @Get() @Roles(Role.NOTARY, Role.REGIONAL_CHAMBER_ADMIN, Role.AUDITOR) list(): RegionalRequest[] { return this.regional.list(); }
}
