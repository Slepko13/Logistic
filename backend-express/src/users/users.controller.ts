import { Request, Response } from 'express';
import { usersService } from './users.service';

/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: КОНТРОЛЕРИ
 * ==========================================
 * У NestJS ми використовували декоратори `@Controller()`, `@Post()`, `@Body()`.
 * Nest автоматично розпаковував тіло запиту і передавав його як аргумент методу.
 * 
 * В Express контролери — це просто функції (або методи класу), які приймають
 * об'єкти `Request` і `Response`. Вони відповідають за те, щоб витягти дані 
 * з `req`, передати їх у сервіс, і відправити результат через `res.json()`.
 * Зверніть увагу, що ми не пишемо тут блоки try/catch, оскільки всі ці
 * функції будуть обгорнуті в наш `asyncHandler`.
 */

class UsersController {
  async login(req: Request, res: Response) {
    // req.body вже провалідований нашим Zod мідлваром
    const result = await usersService.login(req.body);
    res.json(result);
  }

  async createUser(req: Request, res: Response) {
    const user = await usersService.createUser(req.body);
    res.status(201).json(user);
  }

  async getProfile(req: Request, res: Response) {
    // req.user встановлюється мідлваром authenticate
    const userId = req.user.id;
    const user = await usersService.getProfile(userId);
    res.json(user);
  }
}

export const usersController = new UsersController();
