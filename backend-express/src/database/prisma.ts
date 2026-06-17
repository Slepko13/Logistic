import { PrismaClient } from '@prisma/client';

/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: PRISMA CLIENT
 * ==========================================
 * У NestJS ми створювали `PrismaService`, який наслідував `PrismaClient` 
 * і реалізовував `OnModuleInit`. Ми підключали базу через `await this.$connect()` 
 * при старті додатку, і цей сервіс був доступний через Dependency Injection (DI)
 * у будь-якому модулі.
 * 
 * В Express немає вбудованого DI-контейнера. Щоб уникнути створення нового 
 * з'єднання з БД на кожен запит (це вбило б базу), ми експортуємо єдиний (Singleton)
 * екземпляр `PrismaClient`. Node.js кешує модулі при першому `import`, тому 
 * всі файли, які зроблять `import prisma from './prisma'`, отримають 
 * посилання на один і той самий об'єкт пулу з'єднань.
 */

// Ініціалізуємо Prisma. 
// PrismaClient автоматично підключиться до БД при першому запиті.
const prisma = new PrismaClient();

export default prisma;
