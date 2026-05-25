export const UserRole = {
  ADMIN: 'admin',
  DRIVER: 'driver',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// Тепер номер адміна можна задати в Render/Vercel через змінні оточення
export const INITIAL_ADMIN_PHONE = process.env.INITIAL_ADMIN_PHONE || '+380503733160';
