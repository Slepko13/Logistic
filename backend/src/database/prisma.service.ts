import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { INITIAL_ADMIN_PHONE, UserRole } from '../users/user-role';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbUser = process.env.DB_USER || 'logistic';
    const dbPassword = process.env.DB_PASSWORD || 'logistic';
    const dbHost = process.env.DB_HOST === 'db' ? 'localhost' : process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'logistic';

    const databaseUrl =
      process.env.DATABASE_URL ||
      `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
    await this.promoteInitialAdmin();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async promoteInitialAdmin() {
    const adminPhone = INITIAL_ADMIN_PHONE;

    // Find the user by phone
    const user = await this.user.findUnique({
      where: { phone: adminPhone },
    });

    if (user && user.role !== UserRole.ADMIN) {
      await this.user.update({
        where: { id: user.id },
        data: { role: UserRole.ADMIN },
      });
      console.log(`Promoted user with phone ${adminPhone} to ADMIN role.`);
    }
  }
}
