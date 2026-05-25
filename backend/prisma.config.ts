import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// ---------------------------------------------------------------------------
// 1. Побудувати DATABASE_URL (якщо не задано в env — збираємо з окремих змінних)
// ---------------------------------------------------------------------------
const dbUser = process.env.DB_USER || 'logistic';
const dbPassword = process.env.DB_PASSWORD || 'logistic';
const dbHost = process.env.DB_HOST === 'db' ? 'localhost' : process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'logistic';

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

// ---------------------------------------------------------------------------
// 2. Для міграцій потрібне ПРЯМЕ підключення (не через PgBouncer).
//    Supabase pooler працює на порту 6543, а прямий — на 5432.
//    Якщо DIRECT_URL задано — використовуємо його.
//    Інакше — автоматично замінюємо порт 6543 → 5432 у DATABASE_URL.
// ---------------------------------------------------------------------------
const directUrl = process.env.DIRECT_URL || databaseUrl.replace(':6543/', ':5432/');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
    directUrl: directUrl,
  },
});
