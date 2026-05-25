import "dotenv/config";
import { defineConfig } from "prisma/config";

const dbUser = process.env.DB_USER || 'logistic';
const dbPassword = process.env.DB_PASSWORD || 'logistic';
const dbHost = process.env.DB_HOST === 'db' ? 'localhost' : (process.env.DB_HOST || 'localhost');
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'logistic';

const databaseUrl = process.env.DATABASE_URL || `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
