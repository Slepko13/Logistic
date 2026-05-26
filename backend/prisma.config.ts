import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// ---------------------------------------------------------------------------
// Побудувати DATABASE_URL (якщо не задано в env — збираємо з окремих змінних)
// ---------------------------------------------------------------------------
const dbUser = process.env.DB_USER || 'logistic';
const dbPassword = process.env.DB_PASSWORD || 'logistic';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'logistic';

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

// ---------------------------------------------------------------------------
// Prisma CLI використовується ТІЛЬКИ для:
//   1. prisma generate — не підключається до БД взагалі
//   2. prisma migrate  — потребує ПРЯМОГО з'єднання (не через PgBouncer)
//
// Тому тут ми завжди використовуємо прямий порт (5432 замість 6543).
// Рантайм NestJS бере URL окремо з prisma.service.ts через pg Pool адаптер.
// ---------------------------------------------------------------------------

const directUrl = databaseUrl.replace(':6543/', ':5432/');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: directUrl,
  },
});
