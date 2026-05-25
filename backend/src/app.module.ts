import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CitiesModule } from './cities/cities.module';

// AppModule - це найголовніший модуль вашого бекенду.
// Тут ми "склеюємо" всі інші модулі (Auth, Database) в одну велику програму.
@Module({
  imports: [
    // Підключаємо модуль для роботи з базою даних (наш кастомний)
    DatabaseModule,
    // Підключаємо модуль користувачів
    UsersModule,
    // Підключаємо модуль авторизації (логіка логіну/реєстрації)
    AuthModule,
    // Підключаємо модуль подорожей
    TripsModule,
    // 3. RATE LIMITING (Обмеження запитів):
    // Захищаємо бекенд від ботів та брутфорсу (підбору паролів).
    // Дозволяємо максимум 60 запитів за 1 хвилину з однієї IP адреси.
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 секунд (час життя ліміту)
        limit: 60, // максимум 60 запитів
      },
    ]),
    VehiclesModule,
    CitiesModule,
  ],
  controllers: [
    HealthController, // Контролер для перевірки чи живий сервер (пінгується Render'ом)
  ],
  providers: [
    {
      // Активуємо Rate Limiter глобально для всього бекенду
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
