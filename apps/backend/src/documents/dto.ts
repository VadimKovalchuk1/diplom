// DTO описывают входные данные API и правила валидации.
import { IsHash, IsOptional, IsString } from 'class-validator';

export class RegisterDocumentDto {
  // Имя файла нужно для metadata и UI, но не записывается в открытом виде on-chain.
  @IsString() fileName!: string;
  // MIME type помогает frontend'у корректно показывать/скачивать документ.
  @IsString() mimeType!: string;
  // Base64-контент — демонстрационный способ передать файл через JSON API.
  @IsString() base64Content!: string;
  // Код региональной палаты нужен для маршрутизации межрегионального документооборота.
  @IsOptional() @IsString() regionalChamberCode?: string;
}

export class VerifyDocumentDto {
  // documentId — идентификатор записи в blockchain registry.
  @IsString() documentId!: string;
  // sha256 — внешний checksum документа; валидатор проверяет формат hash.
  @IsHash('sha256') sha256!: string;
}
