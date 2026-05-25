export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined in production.');
    }
    return 'logistic-dev-secret';
  }
  return secret;
}
