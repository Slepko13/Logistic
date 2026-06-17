import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma';
import { CreateUserInput, LoginInput } from './users.schema';
import { AppError } from '../common/errors/AppError';

class UsersService {
  async createInitialAdmin() {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    if (adminCount === 0) {
      const password = process.env.INITIAL_ADMIN_PASSWORD || '12345678';
      const phone = process.env.INITIAL_ADMIN_PHONE || '+380503733160';
      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          phone,
          password_hash: hashedPassword,
          first_name: 'Admin',
          last_name: 'Admin',
          role: 'ADMIN',
        },
      });
      console.log('✅ Initial admin created');
    }
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      throw new AppError('Invalid credentials', 401);
    }

    const payload = { sub: user.id, role: user.role };
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    const { password_hash, ...userWithoutPassword } = user;
    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  async createUser(data: CreateUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new AppError('User with this phone already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        role: data.role || 'DRIVER',
        password_hash: hashedPassword,
      },
    });

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const usersService = new UsersService();
