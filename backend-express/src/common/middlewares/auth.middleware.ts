import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import prisma from '../../database/prisma';

/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: АВТОРИЗАЦІЯ (Guards)
 * ==========================================
 * У NestJS ми використовували Passport.js та створювали класи `JwtAuthGuard` 
 * і `RolesGuard`. Ми вішали декоратори `@UseGuards(JwtAuthGuard)` та `@Roles('ADMIN')`
 * над маршрутами або цілими контролерами.
 * 
 * В Express концепція Guard-ів реалізується через звичайні мідлвари.
 * 1. `authenticate` — мідлвар, який перевіряє JWT токен (замінює JwtAuthGuard).
 * 2. `authorize` — функція, яка повертає мідлвар для перевірки ролі (замінює RolesGuard).
 * 
 * Ці мідлвари ми будемо вставляти прямо в ланцюжок роутів:
 * router.get('/secret', authenticate, authorize(['ADMIN']), controller.getSecret);
 */

// Розширюємо інтерфейс Request, щоб Typescript знав про req.user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    
    // Верифікуємо токен
    const decoded: any = jwt.verify(token, secret);

    // Перевіряємо, чи користувач все ще існує (можливо його видалили після видачі токена)
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.sub || decoded.id },
    });

    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // Зберігаємо користувача в req, щоб наступні мідлвари/контролери мали до нього доступ
    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user вже встановлений мідлваром authenticate
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
