import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const dbUser = process.env.DB_USER || 'logistic';
const dbPassword = process.env.DB_PASSWORD || 'logistic';
const dbHost = process.env.DB_HOST === 'db' ? 'localhost' : process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'logistic';

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

process.env.DATABASE_URL = databaseUrl;
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = databaseUrl; // Fallback for local
}

console.log('PRISMA CONFIG ARGV:', process.argv);

const isMigrate = process.argv.includes('migrate');
let migrationUrl = process.env.DATABASE_URL;

if (isMigrate) {
  migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (migrationUrl && migrationUrl.includes(':6543')) {
    migrationUrl = migrationUrl.replace(':6543', ':5432');
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: migrationUrl,
  },
});
