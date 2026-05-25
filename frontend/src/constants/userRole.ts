export const UserRole = {
  ADMIN: 'admin',
  DRIVER: 'driver',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const ROLE_LABELS: Record<UserRoleType, string> = {
  admin: 'Адмін',
  driver: 'Водій',
};
