const UA_PHONE_PATTERN = /^(\+?380|0)\d{9}$/;

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function normalizePhone(phone: string): string | null {
  const digits = phoneDigits(phone);

  if (digits.length === 12 && digits.startsWith('380')) {
    return `+${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+38${digits}`;
  }

  return null;
}

export function isValidPhone(phone: string): boolean {
  const compact = phone.replace(/[\s\-()]/g, '');
  if (!UA_PHONE_PATTERN.test(compact)) {
    return false;
  }
  return normalizePhone(phone) !== null;
}

export function phoneLookupKeys(phone: string): string[] {
  const trimmed = phone.trim();
  const normalized = normalizePhone(trimmed);
  const digits = phoneDigits(trimmed);

  const keys = new Set([trimmed]);
  if (normalized) keys.add(normalized);
  if (digits) keys.add(digits);
  if (digits.length === 10 && digits.startsWith('0')) keys.add(`38${digits}`);
  if (digits.length === 12 && digits.startsWith('380')) keys.add(`+${digits}`);

  return [...keys];
}
