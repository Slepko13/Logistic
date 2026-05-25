import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;

  // В production CORS_ORIGINS обов'язково має бути задано
  if (!raw && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CORS_ORIGINS must be set in production (comma-separated list of allowed origins)',
    );
  }

  // Для локальної розробки — дозволяємо Vite dev-сервер і Docker-фронтенд
  if (!raw) {
    return ['http://localhost:5173', 'http://localhost:8080'];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
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
