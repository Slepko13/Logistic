/**
 * ==========================================
 * ЕКСПРЕС VS NESTJS: КЕРУВАННЯ ПОМИЛКАМИ
 * ==========================================
 * У NestJS існують вбудовані класи помилок, такі як `NotFoundException`, 
 * `BadRequestException` тощо. Коли ви кидаєте (throw) таку помилку, 
 * вбудований Exception Filter перехоплює її і форматує у JSON відповідь.
 * 
 * В Express нам потрібно створити власну базу для керованих помилок 
 * (operational errors). Цей клас `AppError` дозволяє нам вказати HTTP статус
 * та повідомлення. Глобальний обробник помилок (в `index.ts`) буде перевіряти,
 * чи помилка є екземпляром `AppError`, і повертати відповідний статус.
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // Вказує, що це очікувана помилка бізнес-логіки, а не баг в коді
    this.isOperational = true;

    // Зберігаємо правильний stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
