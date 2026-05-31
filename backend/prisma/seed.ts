import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = process.env.INITIAL_ADMIN_PHONE || '+380000000000';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || '123456';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        phone: adminPhone,
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      },
    });
    console.log(`Created default admin user with phone ${adminPhone}`);
  } else {
    console.log(`Default admin user already exists.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
