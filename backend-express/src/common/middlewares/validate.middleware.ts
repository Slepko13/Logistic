import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: ВАЛІДАЦІЯ ДАНИХ (DTO)
 * ==========================================
 * У NestJS ми використовували `class-validator` та декоратори у DTO-класах 
 * (наприклад, `@IsString()`, `@IsOptional()`), а перевірку автоматично робив 
 * `ValidationPipe`, підключений глобально в `main.ts`.
 * 
 * В Express з Zod ми не використовуємо класи. Замість цього ми описуємо
 * схеми валідації (Zod Schema). Цей мідлвар є аналогом `ValidationPipe`.
 * Він приймає Zod-схему і валідує `req.body`, `req.query`, та `req.params`.
 * Якщо валідація не проходить, ми перехоплюємо `ZodError` і повертаємо 400.
 */

export const validate = (schema: ZodObject<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Валідуємо і парсимо дані. Zod автоматично "відріже" зайві поля, 
      // якщо ми використовуємо .strip() у схемі (за замовчуванням).
      // Це аналог `whitelist: true` у ValidationPipe NestJS.
      const validData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Перезаписуємо оригінальні дані очищеними і типізованими даними з Zod
      req.body = validData.body;
      req.query = validData.query as any;
      req.params = validData.params as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error as any;
        const formattedErrors = zodError.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        
        return res.status(400).json({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      next(new AppError('Validation processing error', 500));
    }
  };
};
