import { Request, Response, NextFunction } from 'express';

/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: ОБРОБКА АСИНХРОННИХ ПОМИЛОК
 * ==========================================
 * У NestJS, якщо контролер є `async`, будь-яка помилка, кинута через `throw`,
 * автоматично перехоплюється фреймворком.
 * 
 * В Express 4.x (який ми використовуємо) асинхронні помилки в промісах 
 * не передаються автоматично у `next(err)`. Якщо не обгорнути async код
 * у try/catch і не передати помилку в `next()`, додаток зависне або впаде 
 * з `Unhandled Promise Rejection`.
 * 
 * Ця обгортка `asyncHandler` автоматично перехоплює всі `catch` і кидає їх 
 * у глобальний обробник помилок. Тепер наші контролери будуть чистими, як у Nest!
 */

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
