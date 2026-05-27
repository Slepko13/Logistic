import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService, PublicUser } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { assertLoginInput, throwInvalidCredentials } from './auth.validation';

// Service (Сервіс) - це місце, де живе вся "бізнес-логіка".
// Контролер просто приймає дані, а Сервіс робить всю брудну роботу:
// хешує паролі, перевіряє чи існує юзер, генерує токени.
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Логіка логіну
  async login(dto: LoginDto) {
    const { phone, password } = assertLoginInput(dto);

    // 1. Шукаємо юзера за номером телефону
    const user = await this.usersService.findByPhoneNormalized(phone);
    if (!user) {
      throwInvalidCredentials(); // "Невірний логін або пароль"
    }

    // 2. Порівнюємо введений пароль з тим хешем, що лежить у базі
    const valid = await bcrypt.compare(password, user!.password_hash);
    if (!valid) {
      throwInvalidCredentials();
    }

    // 3. Якщо все ок — генеруємо токен доступу
    return this.buildAuthResponse(this.usersService.toPublic(user!));
  }

  // Ця функція створює JWT-токен (цифровий підпис-перепустку)
  private buildAuthResponse(user: PublicUser) {
    // Вшиваємо в токен тільки ID та номер телефону
    const payload = { sub: user.id, phone: user.phone };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
