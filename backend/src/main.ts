import 'dotenv/config'; // Обов'язково першим рядком, щоб завантажити .env змінні в process.env
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';

// Ця функція визначає, з яких веб-сайтів дозволено робити запити до нашого бекенду.
// Для локальної розробки дозволяємо будь-який порт на localhost (5173, 5174, 5175...).
// Для production — суворий список з CORS_ORIGINS env-змінної.
type CorsOriginFn = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => void;

function getCorsOriginHandler(): string[] | CorsOriginFn {
  const raw = process.env.CORS_ORIGINS;

  // В production CORS_ORIGINS обов'язково має бути задано
  if (!raw && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CORS_ORIGINS must be set in production (comma-separated list of allowed origins)',
    );
  }

  // Для локальної розробки — динамічна перевірка
  if (!raw || process.env.NODE_ENV !== 'production') {
    return (origin, callback) => {
      // Запити без origin (curl, Postman) — дозволяємо
      if (!origin) return callback(null, true);
      // Будь-який localhost незалежно від порту
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      // Якщо env заданий — перевіряємо також список
      if (raw) {
        const allowed = raw
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean);
        if (allowed.includes(origin)) return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    };
  }

  // Production — строгий список
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

// Це головна функція, яка запускає наш бекенд сервер (Entry Point)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Валідація DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Глобальний обробник помилок (ховає Prisma-помилки від клієнта)
  app.useGlobalFilters(new AllExceptionsFilter());

  // LOGGING: Логування всіх вхідних запитів у консоль (дуже корисно для відладки)
  app.use(morgan('dev'));

  // 1. HELMET: Додаємо базовий захист безпеки
  // Він автоматично проставляє правильні HTTP-заголовки (HSTS, X-Frame-Options тощо),
  // щоб захистити наш сайт від поширених атак (наприклад, щоб наш сайт не вставили в iframe зловмисники).
  app.use(helmet());

  // 2. CORS: Дозволяємо лише нашому фронтенду (Vercel) робити запити сюди
  app.enableCors({
    origin: getCorsOriginHandler(),
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
