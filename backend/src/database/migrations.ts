export interface Migration {
  id: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    id: '202605221_remove_shipments_table',
    sql: `
      DROP TABLE IF EXISTS shipments;
    `,
  },
  {
    id: '202605222_replace_user_role_with_driver',
    sql: `
      UPDATE users SET role = 'driver' WHERE role = 'user';

      ALTER TABLE users
      ALTER COLUMN role SET DEFAULT 'driver';

      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check;

      ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'driver'));
    `,
  },
];
