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
    const adapter = new PrismaPg(pool);

    // ВАЖЛИВО: Передаємо databaseUrl безпосередньо в рушій Prisma, 
    // щоб він знав, що треба робити префікс "staging"."users"
    // @ts-expect-error - TS може сваритися на datasources, але під капотом Prisma це підтримує
    super({ 
      adapter,
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    
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
