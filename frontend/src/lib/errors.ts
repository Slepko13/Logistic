const API_ERROR_TRANSLATIONS: Record<string, string> = {
  'phone, first_name, last_name and password are required': 'Заповніть усі обовʼязкові поля',
  'password must be at least 6 characters': 'Пароль має містити щонайменше 6 символів',
  'user with this phone already exists': 'Користувач з таким номером телефону вже існує',
  'invalid phone or password': 'Невірний номер телефону або пароль',
  'phone and password are required': 'Заповніть номер телефону та пароль',
  'API request failed': 'Помилка зʼєднання з сервером',
  'Помилка запиту': 'Помилка запиту',
  Unauthorized: 'Необхідно увійти в систему',
  'Доступ лише для адміністратора': 'Доступ лише для адміністратора',
  'Неможливо видалити адміністратора': 'Неможливо видалити адміністратора',
  'Користувача не знайдено': 'Користувача не знайдено',
  'Користувач вже є адміністратором': 'Користувач вже є адміністратором',
};

export function translateApiError(message?: string | null): string {
  if (!message || typeof message !== 'string') {
    return 'Сталася невідома помилка';
  }

  const trimmed = message.trim();

  if (API_ERROR_TRANSLATIONS[trimmed]) {
    return API_ERROR_TRANSLATIONS[trimmed];
  }

  const hasCyrillic = /[а-яА-ЯіїєґІЇЄҐ]/.test(trimmed);
  if (hasCyrillic) {
    return trimmed;
  }

  return trimmed;
}
