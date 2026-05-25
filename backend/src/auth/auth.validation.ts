import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { isValidPhone, normalizePhone } from '../common/phone.util';

export { isValidPhone, normalizePhone };

export function countLetters(value: string): number {
  const matches = value.match(/\p{L}/gu);
  return matches ? matches.length : 0;
}

export function validateName(
  value: string | undefined,
  fieldLabel: 'Імʼя' | 'Прізвище',
): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return `${fieldLabel} є обовʼязковим`;
  }
  if (countLetters(trimmed) < 3) {
    return `${fieldLabel} має містити щонайменше 3 літери`;
  }
  return null;
}

export function getRegisterValidationErrors(input: {
  phone?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
}): string[] {
  const errors: string[] = [];

  const firstNameError = validateName(input.first_name, 'Імʼя');
  if (firstNameError) errors.push(firstNameError);

  const lastNameError = validateName(input.last_name, 'Прізвище');
  if (lastNameError) errors.push(lastNameError);

  const phoneRaw = input.phone?.trim() ?? '';
  if (!phoneRaw) {
    errors.push('Номер телефону є обовʼязковим');
  } else if (!isValidPhone(phoneRaw)) {
    errors.push('Невірний формат номера телефону. Приклад: +380501234567');
  }

  const password = input.password ?? '';
  if (!password) {
    errors.push('Пароль є обовʼязковим');
  } else if (password.length < 6) {
    errors.push('Пароль має містити щонайменше 6 символів');
  }

  return errors;
}

export function getLoginValidationErrors(input: { phone?: string; password?: string }): string[] {
  const errors: string[] = [];
  const phoneRaw = input.phone?.trim() ?? '';

  if (!phoneRaw) {
    errors.push('Номер телефону є обовʼязковим');
  } else if (!isValidPhone(phoneRaw)) {
    errors.push('Невірний формат номера телефону. Приклад: +380501234567');
  }

  if (!input.password) {
    errors.push('Пароль є обовʼязковим');
  }

  return errors;
}

export function parseRegisterInput(input: {
  phone?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
}): { phone: string; first_name: string; last_name: string; password: string } | null {
  if (getRegisterValidationErrors(input).length > 0) {
    return null;
  }

  const normalizedPhone = normalizePhone(input.phone!.trim());
  if (!normalizedPhone) {
    return null;
  }

  return {
    phone: normalizedPhone,
    first_name: input.first_name!.trim(),
    last_name: input.last_name!.trim(),
    password: input.password!,
  };
}

export function parseLoginInput(input: {
  phone?: string;
  password?: string;
}): { phone: string; password: string } | null {
  if (getLoginValidationErrors(input).length > 0) {
    return null;
  }

  const normalizedPhone = normalizePhone(input.phone!.trim());
  if (!normalizedPhone) {
    return null;
  }

  return { phone: normalizedPhone, password: input.password! };
}

export function assertRegisterInput(dto: {
  phone?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
}) {
  const errors = getRegisterValidationErrors(dto);
  if (errors.length > 0) {
    throw new BadRequestException(errors.join(' '));
  }

  const validated = parseRegisterInput(dto);
  if (!validated) {
    throw new BadRequestException('Невірний формат номера телефону. Приклад: +380501234567');
  }
  return validated;
}

export function assertLoginInput(dto: { phone?: string; password?: string }) {
  const errors = getLoginValidationErrors(dto);
  if (errors.length > 0) {
    throw new UnauthorizedException(errors.join(' '));
  }

  const validated = parseLoginInput(dto);
  if (!validated) {
    throw new UnauthorizedException('Невірний формат номера телефону. Приклад: +380501234567');
  }
  return validated;
}

export const AUTH_ERRORS_UK = {
  USER_EXISTS: 'Користувач з таким номером телефону вже існує',
  INVALID_CREDENTIALS: 'Невірний номер телефону або пароль',
} as const;

export function throwUserExists(): never {
  throw new ConflictException(AUTH_ERRORS_UK.USER_EXISTS);
}

export function throwInvalidCredentials(): never {
  throw new UnauthorizedException(AUTH_ERRORS_UK.INVALID_CREDENTIALS);
}
