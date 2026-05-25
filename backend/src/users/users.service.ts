import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidPhone, normalizePhone, phoneDigits, phoneLookupKeys } from '../common/phone.util';
import { validateName } from '../auth/auth.validation';
import { DatabaseService } from '../database/database.service';
import { UserRole, UserRoleType } from './user-role';
import { UpdateUserDto } from './dto/update-user.dto';

export interface User {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role: UserRoleType;
  created_at: string;
}

export interface PublicUser {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  role: UserRoleType;
}

export interface UserListItem extends PublicUser {
  created_at: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async findByPhone(phone: string): Promise<User | null> {
    const keys = phoneLookupKeys(phone);
    const digitsVariants = keys.map(phoneDigits).filter(Boolean);

    const { rows } = await this.database.getPool().query<User>(
      `SELECT id, phone, first_name, last_name, password_hash, role, created_at
       FROM users
       WHERE phone = ANY($1::text[])
          OR regexp_replace(phone, '\\D', '', 'g') = ANY($2::text[])`,
      [keys, digitsVariants],
    );
    return rows[0] ?? null;
  }

  async findByPhoneNormalized(phone: string): Promise<User | null> {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return this.findByPhone(phone);
    }
    return this.findByPhone(normalized);
  }

  async findAll(): Promise<UserListItem[]> {
    const { rows } = await this.database.getPool().query<UserListItem>(
      `SELECT id, phone, first_name, last_name, role, created_at
       FROM users
       ORDER BY created_at DESC`,
    );
    return rows;
  }

  async findById(id: number): Promise<PublicUser | null> {
    const { rows } = await this.database
      .getPool()
      .query<PublicUser>(`SELECT id, phone, first_name, last_name, role FROM users WHERE id = $1`, [
        id,
      ]);
    return rows[0] ?? null;
  }

  async create(
    phone: string,
    firstName: string,
    lastName: string,
    passwordHash: string,
  ): Promise<PublicUser> {
    const { rows } = await this.database.getPool().query<PublicUser>(
      `INSERT INTO users (phone, first_name, last_name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, phone, first_name, last_name, role`,
      [phone, firstName, lastName, passwordHash, UserRole.DRIVER],
    );
    return rows[0];
  }

  async deleteById(id: number): Promise<void> {
    const target = await this.findById(id);
    if (!target) {
      throw new NotFoundException('Користувача не знайдено');
    }
    if (target.role === UserRole.ADMIN) {
      throw new ForbiddenException('Неможливо видалити адміністратора');
    }

    await this.database.getPool().query('DELETE FROM users WHERE id = $1', [id]);
  }

  async promoteToAdmin(id: number): Promise<PublicUser> {
    const target = await this.findById(id);
    if (!target) {
      throw new NotFoundException('Користувача не знайдено');
    }
    if (target.role === UserRole.ADMIN) {
      throw new BadRequestException('Користувач вже є адміністратором');
    }

    const { rows } = await this.database.getPool().query<PublicUser>(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, phone, first_name, last_name, role`,
      [UserRole.ADMIN, id],
    );
    return rows[0];
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

    const { rows } = await this.database.getPool().query<PublicUser>(
      `UPDATE users
       SET phone = $1, first_name = $2, last_name = $3
       WHERE id = $4
       RETURNING id, phone, first_name, last_name, role`,
      [normalizedPhone, dto.first_name!.trim(), dto.last_name!.trim(), id],
    );
    return rows[0];
  }

  toPublic(user: User | PublicUser): PublicUser {
    return {
      id: user.id,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };
  }
}
