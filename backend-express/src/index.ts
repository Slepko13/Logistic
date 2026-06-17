import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: ТОЧКА ВХОДУ (main.ts)
 * ==========================================
 * У NestJS ми використовуємо `NestFactory.create(AppModule)` у файлі `main.ts`.
 * NestJS приховує під капотом ініціалізацію Express (або Fastify), налаштування
 * пайплайну (Pipes, Filters, Guards) та Dependency Injection контейнера.
 * 
 * У чистому Express ми маємо створити екземпляр додатку вручну:
 * `const app = express()`.
 * Всі мідлвари (middlewares), такі як CORS, Helmet, Body Parser, ми також
 * маємо підключати вручну в правильному порядку. Порядок тут є КРИТИЧНИМ:
 * мідлвари обробляються згори донизу.
 * 
 * Наприклад, у NestJS ми писали:
 * `app.enableCors(...)` та `app.use(helmet())`
 * В Express ми робимо те саме, але через `app.use(...)`.
 */

const app: Express = express();
const port = process.env.PORT || 3001; // Використовуємо 3001, щоб не конфліктувати з існуючим NestJS на 3000

// 1. Налаштування безпеки (Security)
// Замінює app.use(helmet()) з NestJS
app.use(helmet());

// 2. Налаштування CORS
// Замінює app.enableCors() з NestJS
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) 
  : ['http://localhost:5173']; // Локальний фронтенд за замовчуванням

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Accept, Authorization',
}));

// 3. Парсинг тіла запиту (Body parsing)
// У NestJS це включено "з коробки" (вбудований BodyParser).
// В Express ми маємо явно сказати йому парсити JSON:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Логування HTTP запитів
// У NestJS ми підключали morgan через app.use(morgan('dev')).
app.use(morgan('dev'));

import userRoutes from './users/users.routes';
import cityRoutes from './cities/cities.routes';
import vehicleRoutes from './vehicles/vehicles.routes';
import tripRoutes from './trips/trips.routes';
import { usersService } from './users/users.service';

// Базовий Health Check роут
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Підключення роутів (аналог імпорту модуля в AppModule)
app.use('/api/users', userRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);

/**
 * Глобальний обробник помилок (Global Error Handler).
 * У NestJS ми використовуємо Exception Filters (наприклад, AllExceptionsFilter).
 * В Express це спеціальний мідлвар з 4 аргументами (err, req, res, next).
 * Якщо мідлвар має 4 аргументи, Express знає, що це обробник помилок.
 * ВАЖЛИВО: Він має бути останнім у ланцюжку `app.use()`.
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    statusCode: status,
    message: message,
    // Уникаємо витоку стеку помилок у production
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// Асинхронна функція для старту сервера та ініціалізації бази
const startServer = async () => {
  try {
    // Створюємо адміна (аналог OnModuleInit)
    await usersService.createInitialAdmin();
    
    app.listen(port, () => {
      console.log(`[Express] Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
