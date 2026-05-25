import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isValidPhone, normalizePhone, phoneDigits, phoneLookupKeys } from '../common/phone.util';
import { validateName } from '../auth/auth.validation';
import { PrismaService } from '../database/prisma.service';
import { UserRole, UserRoleType } from './user-role';
import { UpdateUserDto } from './dto/update-user.dto';

export interface PublicUser {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  role: UserRoleType;
}

export interface UserListItem extends PublicUser {
  created_at: Date | string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhone(phone: string) {
    const keys = phoneLookupKeys(phone);
    const digitsVariants = keys.map(phoneDigits).filter(Boolean);

    // Шукаємо по точним співпадінням
    const exactMatch = await this.prisma.user.findFirst({
      where: { phone: { in: keys } },
    });
    if (exactMatch) return exactMatch;

    // Якщо не знайшли - використовуємо сирий запит для складної логіки з регулярками
    if (digitsVariants.length > 0) {
      const rawUsers = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM users WHERE regexp_replace(phone, '\\D', '', 'g') = ANY($1::text[])`,
        digitsVariants,
      );
      return rawUsers[0] ?? null;
    }

    return null;
  }

  async findByPhoneNormalized(phone: string) {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return this.findByPhone(phone);
    }
    return this.findByPhone(normalized);
  }

  async findAll(): Promise<UserListItem[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        phone: true,
        first_name: true,
        last_name: true,
        role: true,
        created_at: true,
      },
    });
    return users as unknown as UserListItem[];
  }

  async findById(id: number): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    });
    return user as unknown as PublicUser | null;
  }

  async create(
    phone: string,
    firstName: string,
    lastName: string,
    passwordHash: string,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.create({
      data: {
        phone,
        first_name: firstName,
        last_name: lastName,
        password_hash: passwordHash,
        role: UserRole.DRIVER,
      },
      select: {
        id: true,
        phone: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    });
    return user as unknown as PublicUser;
  }

  async deleteById(id: number): Promise<void> {
    const target = await this.findById(id);
    if (!target) {
      throw new NotFoundException('Користувача не знайдено');
    }
    if (target.role === UserRole.ADMIN) {
      throw new ForbiddenException('Неможливо видалити адміністратора');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async promoteToAdmin(id: number): Promise<PublicUser> {
    const target = await this.findById(id);
    if (!target) {
      throw new NotFoundException('Користувача не знайдено');
    }
    if (target.role === UserRole.ADMIN) {
      throw new BadRequestException('Користувач вже є адміністратором');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: UserRole.ADMIN },
      select: {
        id: true,
        phone: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    });
    return updated as unknown as PublicUser;
  }

  async updateById(id: number, dto: UpdateUserDto): Promise<PublicUser> {
    const target = await this.findById(id);
    if (!target) {
      throw new NotFoundException('Користувача не знайдено');
    }

    const firstNameError = validateName(dto.first_name, 'Імʼя');
    const lastNameError = validateName(dto.last_name, 'Прізвище');
    const phoneRaw = dto.phone?.trim() ?? '';
    const errors = [firstNameError, lastNameError].filter(Boolean);

    if (!phoneRaw) {
      errors.push('Номер телефону є обовʼязковим');
    } else if (!isValidPhone(phoneRaw)) {
      errors.push('Невірний формат номера телефону. Приклад: +380501234567');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(' '));
    }

    const normalizedPhone = normalizePhone(phoneRaw);
    if (!normalizedPhone) {
      throw new BadRequestException('Невірний формат номера телефону. Приклад: +380501234567');
    }

    const existing = await this.findByPhoneNormalized(normalizedPhone);
    if (existing && existing.id !== id) {
      throw new ConflictException('Користувач з таким номером телефону вже існує');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        phone: normalizedPhone,
        first_name: dto.first_name!.trim(),
        last_name: dto.last_name!.trim(),
      },
      select: {
        id: true,
        phone: true,
        first_name: true,
        last_name: true,
        role: true,
      },
    });
    return updated as unknown as PublicUser;
  }

  toPublic(user: any): PublicUser {
    return {
      id: user.id,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };
  }
}
