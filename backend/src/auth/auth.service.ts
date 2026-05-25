import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService, PublicUser } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  assertLoginInput,
  assertRegisterInput,
  throwInvalidCredentials,
  throwUserExists,
} from './auth.validation';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { phone, first_name, last_name, password } = assertRegisterInput(dto);

    const existing = await this.usersService.findByPhoneNormalized(phone);
    if (existing) {
      throwUserExists();
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(phone, first_name, last_name, passwordHash);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const { phone, password } = assertLoginInput(dto);

    const user = await this.usersService.findByPhoneNormalized(phone);
    if (!user) {
      throwInvalidCredentials();
    }

    const valid = await bcrypt.compare(password, user!.password_hash);
    if (!valid) {
      throwInvalidCredentials();
    }

    return this.buildAuthResponse(this.usersService.toPublic(user!));
  }

  private buildAuthResponse(user: PublicUser) {
    const payload = { sub: user.id, phone: user.phone };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
