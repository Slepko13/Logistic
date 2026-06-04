import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const dbUser = process.env.DB_USER || 'logistic';
    const dbPassword = process.env.DB_PASSWORD || 'logistic';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'logistic';

    const databaseUrl =
      process.env.DATABASE_URL ||
      `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

    const pool = new Pool({ connectionString: databaseUrl });

    // node-postgres (pg) ігнорує параметр ?schema= у URL (він працює тільки для самої Prisma).
    // Щоб драйвер дійсно підключався до потрібної схеми (наприклад, staging),
    // нам треба витягнути цей параметр і задати його при кожному новому з'єднанні.
    try {
      const url = new URL(databaseUrl);
      const schema = url.searchParams.get('schema') || 'public';
      pool.on('connect', (client) => {
        client.query(`SET search_path TO "${schema}", public`);
      });
    } catch (e) {
      console.warn('Could not parse database URL to set schema', e);
    }

    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
