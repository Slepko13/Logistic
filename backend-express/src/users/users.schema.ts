import { z } from 'zod';

/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: СХЕМИ ВАЛІДАЦІЇ (Zod vs DTO)
 * ==========================================
 * У NestJS ми створювали `create-user.dto.ts` і використовували декоратори 
 * `@IsString()`, `@IsOptional()` з бібліотеки `class-validator`.
 * 
 * В Express ми визначаємо об'єкти Zod, які описують структуру і правила.
 * Перевага Zod у тому, що з нього можна автоматично згенерувати TypeScript
 * типи (через `z.infer`), тобто нам не потрібно писати окремо інтерфейс 
 * і окремо клас для валідації — Zod є єдиним джерелом правди.
 */

export const createUserSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'DRIVER']).optional().default('DRIVER'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(1, 'Phone is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Автоматична генерація TypeScript типів з Zod схем
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
