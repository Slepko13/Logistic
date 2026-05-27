import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { isValidPhone, normalizePhone, phoneDigits, phoneLookupKeys } from '../common/phone.util';
import { validateName } from '../auth/auth.validation';
import { PrismaService } from '../database/prisma.service';
import { INITIAL_ADMIN_PHONE, UserRole, UserRoleType } from './user-role';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

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
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.promoteInitialAdmin();
  }

  private async promoteInitialAdmin() {
    const adminPhone = INITIAL_ADMIN_PHONE;

    const count = await this.prisma.user.count();
    if (count === 0) {
      const password = process.env.INITIAL_ADMIN_PASSWORD || '12345678';
      const passwordHash = await bcrypt.hash(password, 10);

      await this.prisma.user.create({
        data: {
          phone: adminPhone,
          first_name: 'Admin',
          last_name: 'System',
          role: UserRole.ADMIN,
          password_hash: passwordHash,
        },
      });

      console.log(`[SEED] Created initial admin with phone ${adminPhone}`);
      if (!process.env.INITIAL_ADMIN_PASSWORD) {
        console.warn(
          `[WARNING] Default password '12345678' used for admin. Please change it immediately.`,
        );
      }
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: { phone: adminPhone },
    });

    if (user && user.role !== UserRole.ADMIN) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.ADMIN },
      });
      console.log(`Promoted user with phone ${adminPhone} to ADMIN role.`);
    }
  }

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
      const rawUsers = await this.prisma.$queryRaw<User[]>(
        Prisma.sql`SELECT * FROM users WHERE regexp_replace(phone, '\\D', '', 'g') = ANY(${digitsVariants}::text[])`,
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
    const user = await this.prisma.$transaction(
      async (tx) => {
        const count = await tx.user.count();
        const role = count === 0 ? UserRole.ADMIN : UserRole.DRIVER;

        return tx.user.create({
          data: {
            phone,
            first_name: firstName,
            last_name: lastName,
            password_hash: passwordHash,
            role,
          },
          select: {
            id: true,
            phone: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return user as unknown as PublicUser;
  }

  async createAdminUser(dto: CreateUserDto): Promise<PublicUser> {
    const phoneRaw = dto.phone.trim();
    if (!isValidPhone(phoneRaw)) {
      throw new BadRequestException('Невірний формат номера телефону. Приклад: +380501234567');
    }

    const normalizedPhone = normalizePhone(phoneRaw);
    if (!normalizedPhone) {
      throw new BadRequestException('Невірний формат номера телефону');
    }

    const existing = await this.findByPhoneNormalized(normalizedPhone);
    if (existing) {
      throw new ConflictException('Користувач з таким номером телефону вже існує');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        phone: normalizedPhone,
        first_name: dto.first_name.trim(),
        last_name: dto.last_name.trim(),
        password_hash: passwordHash,
        role: dto.role || UserRole.DRIVER,
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

    const dataToUpdate: Prisma.UserUpdateInput = {
      phone: normalizedPhone,
      first_name: dto.first_name!.trim(),
      last_name: dto.last_name!.trim(),
    };

    if (dto.password && dto.password.trim().length >= 6) {
      dataToUpdate.password_hash = await bcrypt.hash(dto.password.trim(), 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
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

  toPublic(user: User): PublicUser {
    return {
      id: user.id,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role as UserRoleType,
    };
  }
}
