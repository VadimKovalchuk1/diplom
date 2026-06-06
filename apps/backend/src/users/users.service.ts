// UsersService — демонстрационный сервис управления пользователями и ролями.
// Production-версия должна сохранять записи в PostgreSQL и синхронизировать роли
// со smart contract NotaryAccessControl.
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '../common/roles';

export interface UserAccount { id: string; wallet: string; fullName: string; chamberCode: string; roles: Role[]; active: boolean; }

@Injectable()
export class UsersService {
  private readonly users: UserAccount[] = [];

  // Создаёт пользователя в operational read model.
  create(input: Omit<UserAccount, 'id' | 'active'>): UserAccount {
    const user = { ...input, id: randomUUID(), active: true };
    this.users.push(user);
    return user;
  }

  // Revoke не удаляет пользователя, а помечает inactive — это важно для аудита истории.
  revoke(id: string): void { const user = this.users.find((item) => item.id === id); if (user) user.active = false; }

  list(): UserAccount[] { return this.users; }
}
