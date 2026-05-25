import { API_URL, TOKEN_KEY } from './config';
import { translateApiError } from '@/lib/errors';

export type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

interface FetchOptions extends RequestInit {
  skipUnauthorizedHandler?: boolean;
}

function buildHeaders(options: FetchOptions): HeadersInit {
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseErrorMessage(data: any): string {
  const rawMessage = data?.message ?? data?.error;
  const raw = Array.isArray(rawMessage) ? rawMessage.join(' ') : rawMessage || 'Помилка запиту';

  return typeof raw === 'string' ? translateApiError(raw) : 'Сталася невідома помилка';
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipUnauthorizedHandler = false, ...fetchOptions } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: buildHeaders(fetchOptions),
  });

  if (res.status === 204) {
    return null as unknown as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = parseErrorMessage(data);
    if (res.status === 401 && !skipUnauthorizedHandler) {
      unauthorizedHandler?.();
    }
    throw new ApiError(message, res.status);
  }

  return data as T;
}
