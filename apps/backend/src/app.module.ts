// AppModule — корневой модуль NestJS-приложения.
// В NestJS вся система собирается из модулей: каждый модуль отвечает за отдельную
// бизнес-область и подключается здесь, как блоки enterprise-архитектуры.
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { DocumentsModule } from './documents/documents.module';
import { IpfsModule } from './ipfs/ipfs.module';
import { RegionalModule } from './regional/regional.module';
import { UsersModule } from './users/users.module';
import { ZkModule } from './zk/zk.module';

@Module({
  imports: [
    // ConfigModule читает переменные окружения: RPC_URL, JWT_SECRET, DATABASE_URL и т.д.
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: максимум 120 запросов в минуту на клиента. Это базовая защита
    // от brute-force и DoS на REST API.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    // AuthModule отвечает за wallet-login и JWT.
    AuthModule,
    // UsersModule — управление пользователями и ролями.
    UsersModule,
    // BlockchainModule — RPC-интеграция с Ethereum-compatible сетью.
    BlockchainModule,
    // IpfsModule — шифрование и сохранение документов off-chain.
    IpfsModule,
    // AuditModule — журналирование действий API.
    AuditModule,
    // DocumentsModule — регистрация и проверка нотариальных документов.
    DocumentsModule,
    // RegionalModule — межрегиональные запросы между палатами.
    RegionalModule,
    // ZkModule — генерация и проверка Zero-Knowledge proof.
    ZkModule
  ],
  providers: [
    // Глобальный guard применяет rate limiting ко всем endpoint'ам.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Глобальный interceptor автоматически пишет audit entry после обработки запроса.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }
  ]
})
export class AppModule {}
