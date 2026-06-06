// main.ts — точка входа backend-приложения. Именно этот файл запускается Node.js.
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Создаём NestJS-приложение на базе корневого AppModule.
  const app = await NestFactory.create(AppModule);

  // CORS разрешает frontend'у обращаться к backend API из браузера.
  // В production список origin должен быть строго ограничен доменами организации.
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN?.split(',') ?? ['http://localhost:3000'], credentials: true });

  // Все endpoint'ы получают префикс /api/v1, чтобы в будущем можно было версионировать API.
  app.setGlobalPrefix('api/v1');

  // ValidationPipe проверяет DTO: лишние поля запрещены, типы преобразуются автоматически.
  // Это защищает backend от неожиданных входных данных.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();
