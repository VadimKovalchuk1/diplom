// AuditService хранит API-аудит. В production данные должны писаться в PostgreSQL
// и дополнительно коррелироваться с on-chain событиями AuditContract.
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface AuditEntry { id: string; actorId: string; action: string; entityId?: string; durationMs?: number; createdAt: string; }

@Injectable()
export class AuditService {
  // In-memory журнал для демонстрации. Он очищается при restart backend'а.
  private readonly entries: AuditEntry[] = [];

  // Добавляет запись о действии пользователя/API.
  recordAccess(entry: Omit<AuditEntry, 'id' | 'createdAt'>): void {
    this.entries.push({ ...entry, id: randomUUID(), createdAt: new Date().toISOString() });
  }

  // Возвращает новые записи первыми, чтобы UI показывал актуальные события сверху.
  list(): AuditEntry[] { return [...this.entries].reverse(); }
}
