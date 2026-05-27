import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PublicUser } from '../users/users.service';
import { PublicUserDto } from '../users/dto/public-user.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
// Controller (Контролер) - це "приймальня" нашого бекенду.
// Його єдина задача: прийняти запит від фронтенду (наприклад POST /api/auth/login),
// передати дані у відповідний "сервіс" (AuthService), і повернути відповідь назад фронтенду.
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Обробляє POST запит на логін.
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  // Запит GET /api/auth/me - повертає дані про поточного користувача.
  // @UseGuards(JwtAuthGuard) означає: "СЮДИ МОЖНА ТІЛЬКИ АВТОРИЗОВАНИМ".
  // Якщо запит прийшов без дійсного токена (або токен старий), NestJS автоматично видасть помилку 401 Unauthorized.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, type: PublicUserDto })
  me(@Req() req: Request & { user: PublicUser }) {
    // req.user з'являється тут завдяки jwt.strategy.ts, який розшифрував токен і знайшов користувача в БД
    return req.user;
  }
}
