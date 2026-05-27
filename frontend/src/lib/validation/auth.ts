import { components } from '../../api/schema';

type LoginDto = components['schemas']['LoginDto'];

const UA_PHONE_PATTERN = /^(\+?380|0)\d{9}$/;

export function countLetters(value: string): number {
  const matches = value.match(/\p{L}/gu);
  return matches ? matches.length : 0;
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');

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

export function validateName(value: string | undefined, fieldLabel: string): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return `${fieldLabel} є обовʼязковим`;
  }
  if (countLetters(trimmed) < 3) {
    return `${fieldLabel} має містити щонайменше 3 літери`;
  }
  return null;
}

export function getLoginErrors({ phone, password }: Partial<LoginDto>): string[] {
  const errors: string[] = [];
  const phoneRaw = phone?.trim() ?? '';

  if (!phoneRaw) {
    errors.push('Номер телефону є обовʼязковим');
  } else if (!isValidPhone(phoneRaw)) {
    errors.push('Невірний формат номера телефону. Приклад: +380501234567');
  }

  if (!password) {
    errors.push('Пароль є обовʼязковим');
  }

  return errors;
}

export function prepareLoginPayload({ phone, password }: Partial<LoginDto>): {
  errors: string[];
  payload: LoginDto | null;
} {
  const errors = getLoginErrors({ phone, password });
  if (errors.length > 0) {
    return { errors, payload: null };
  }

  return {
    errors: [],
    payload: {
      phone: normalizePhone(phone!.trim())!,
      password: password!,
    },
  };
}
