import { apiFetch } from './client';
import { components } from './schema';

type LoginDto = components['schemas']['LoginDto'];
type AuthResponseDto = components['schemas']['AuthResponseDto'];
export type PublicUserDto = components['schemas']['PublicUserDto'];

export function login(payload: LoginDto): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipUnauthorizedHandler: true,
  });
}

export function fetchMe(options?: RequestInit): Promise<PublicUserDto> {
  return apiFetch<PublicUserDto>('/api/auth/me', options);
}
