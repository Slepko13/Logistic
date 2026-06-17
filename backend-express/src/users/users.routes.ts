import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../common/middlewares/validate.middleware';
import { createUserSchema, loginSchema } from './users.schema';
import { asyncHandler } from '../common/middlewares/async.middleware';
import { authenticate, authorize } from '../common/middlewares/auth.middleware';

/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: РОУТІНГ (Routing)
 * ==========================================
 * У NestJS роутинг відбувається автоматично через декоратори `@Controller('users')`
 * та підключення модулів у `AppModule`.
 * 
 * В Express ми явно створюємо об'єкт `Router`. Тут ми з'єднуємо всі частини разом:
 * HTTP метод (post, get), шлях, мідлвари (валідація, авторизація) і кінцевий
 * обробник (метод контролера). Потім цей роутер буде підключено в `index.ts`.
 */

const router = Router();

// Публічні роути
router.post(
  '/auth/login',
  validate(loginSchema), // 1. Валідуємо body
  asyncHandler(usersController.login) // 2. Передаємо в контролер (через обгортку для помилок)
);

// Захищені роути (тільки для ADMIN)
router.post(
  '/',
  authenticate, // Перевіряємо токен
  authorize(['ADMIN']), // Перевіряємо роль
  validate(createUserSchema), // Валідуємо дані
  asyncHandler(usersController.createUser) // Контролер
);

// Приватні роути (для всіх залогінених користувачів)
router.get(
  '/profile',
  authenticate,
  asyncHandler(usersController.getProfile)
);

export default router;
