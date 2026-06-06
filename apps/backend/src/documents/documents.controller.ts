// DocumentsController — HTTP API для операций с нотариальными документами.
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/roles';
import { DocumentsService, RegisteredDocument } from './documents.service';
import { RegisterDocumentDto, VerifyDocumentDto } from './dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  // Только авторизованный нотариус может подготовить регистрацию документа.
  @Post() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles(Role.NOTARY)
  register(@Body() dto: RegisterDocumentDto, @Req() req: { user: { wallet: string } }): Promise<RegisteredDocument> { return this.documents.register(dto, req.user.wallet); }

  // Список документов доступен нотариусу и аудитору.
  @Get() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles(Role.NOTARY, Role.AUDITOR) list(): RegisteredDocument[] { return this.documents.list(); }

  // Публичная проверка не требует JWT: любой гражданин/организация может проверить hash.
  @Post('verify') verify(@Body() dto: VerifyDocumentDto): Promise<{ valid: boolean; documentHash: string; source: string }> { return this.documents.verify(dto); }
}
