export const UserRole = {
  ADMIN: 'admin',
  DRIVER: 'driver',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const INITIAL_ADMIN_PHONE = '+380503733160';
