import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { normalizePhone } from '../common/phone.util';
import { INITIAL_ADMIN_PHONE, UserRole } from '../users/user-role';
import { migrations } from './migrations';

@Injectable()
export class DatabaseService implements OnModuleInit {
  // Пул з'єднань (Pool) — це набір "відкритих ліній" до вашої бази даних.
  // Замість того, щоб на кожен запит підключатися заново (що довго), ми тримаємо
  // кілька з'єднань завжди відкритими і просто перевикористовуємо їх.
  private readonly pool = new Pool(
    process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          // Вмикаємо SSL, бо Supabase/Render вимагають шифрованого підключення
          ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : undefined,
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT || 5432),
          user: process.env.DB_USER || 'logistic',
          password: process.env.DB_PASSWORD || 'logistic',
          database: process.env.DB_NAME || 'logistic',
        },
  );

  // onModuleInit — це магічний метод NestJS. Він запускається АВТОМАТИЧНО,
  // як тільки стартує цей сервіс, ще до того, як бекенд почне приймати запити.
  // Тому ми і казали, що окрема "Pre-Deploy Command" на Render вам не потрібна!
  async onModuleInit() {
    const maxRetries = 30; // Пробуємо підключитися 30 разів (корисно для Docker)
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.initDb(); // Якщо вдалося — ініціалізуємо БД
        return;
      } catch (err) {
        if (i === maxRetries - 1) {
          console.error('Failed to connect to database:', (err as Error).message);
          process.exit(1); // Якщо за 30 разів не вийшло - "вбиваємо" сервер
        }
        console.log(`Waiting for database... (${i + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  // Віддає пул з'єднань для інших сервісів (щоб робити запити)
  getPool(): Pool {
    return this.pool;
  }

  // Проста функція-пінг для перевірки "чи жива база?" (використовується в health-check)
  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  private async initDb(): Promise<void> {
    await this.ensureUsersSchema();
    await this.runMigrations();
    await this.normalizeUserPhones();
    await this.promoteInitialAdmin();
  }

  private async ensureUsersSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        first_name VARCHAR(64) NOT NULL,
        last_name VARCHAR(64) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(16) NOT NULL DEFAULT 'driver',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'driver'
    `);
  }

  private async runMigrations(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(128) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const migration of migrations) {
      const existing = await this.pool.query<{ id: string }>(
        'SELECT id FROM schema_migrations WHERE id = $1',
        [migration.id],
      );

      if (existing.rows.length > 0) {
        continue;
      }

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
        await client.query('COMMIT');
        console.log(`Applied database migration: ${migration.id}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  }

  private async normalizeUserPhones(): Promise<void> {
    const { rows } = await this.pool.query<{ id: number; phone: string }>(
      'SELECT id, phone FROM users',
    );

    for (const row of rows) {
      const normalized = normalizePhone(row.phone);
      if (!normalized || normalized === row.phone) {
        continue;
      }

      const conflict = await this.pool.query<{ id: number }>(
        'SELECT id FROM users WHERE phone = $1 AND id <> $2',
        [normalized, row.id],
      );
      if (conflict.rows.length > 0) {
        continue;
      }

      await this.pool.query('UPDATE users SET phone = $1 WHERE id = $2', [normalized, row.id]);
    }
  }

  private async promoteInitialAdmin(): Promise<void> {
    await this.pool.query(
      `UPDATE users SET role = $1
       WHERE phone = $2
          OR regexp_replace(phone, '\\D', '', 'g') = '380503733160'
          OR regexp_replace(phone, '\\D', '', 'g') = '0503733160'`,
      [UserRole.ADMIN, INITIAL_ADMIN_PHONE],
    );
  }
}
