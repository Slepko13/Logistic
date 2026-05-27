import 'dotenv/config'; // Обов'язково першим рядком, щоб завантажити .env змінні в process.env
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';

// Ця функція визначає, з яких веб-сайтів дозволено робити запити до нашого бекенду.
// Це механізм CORS (Cross-Origin Resource Sharing) - базовий захист браузерів.
function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;

  // В production CORS_ORIGINS обов'язково має бути задано (щоб ніхто чужий не стукав до нас)
  if (!raw && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CORS_ORIGINS must be set in production (comma-separated list of allowed origins)',
    );
  }

  // Для локальної розробки (на вашому комп'ютері) дозволяємо запити з локального фронтенду
  if (!raw) {
    return ['http://localhost:5173', 'http://localhost:8080'];
  }

  // Розбиваємо рядок з Render (наприклад "https://site1.com,https://site2.com") на масив
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// Це головна функція, яка запускає наш бекенд сервер (Entry Point)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Валідація DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // LOGGING: Логування всіх вхідних запитів у консоль (дуже корисно для відладки)
  app.use(morgan('dev'));

  // 1. HELMET: Додаємо базовий захист безпеки
  // Він автоматично проставляє правильні HTTP-заголовки (HSTS, X-Frame-Options тощо),
  // щоб захистити наш сайт від поширених атак (наприклад, щоб наш сайт не вставили в iframe зловмисники).
  app.use(helmet());

  // 2. CORS: Дозволяємо лише нашому фронтенду (Vercel) робити запити сюди
  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Кешувати preflight 24 години
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Logistic API')
    .setDescription('API для системи управління пасажирськими перевезеннями')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`Backend listening on port ${port}`);
}

bootstrap();
// force restart
