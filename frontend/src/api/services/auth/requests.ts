import { apiFetch } from '../../client';
import { components } from '../../schema';
import { ENDPOINTS } from '../../endpoints';

type LoginDto = components['schemas']['LoginDto'];
type AuthResponseDto = components['schemas']['AuthResponseDto'];
export type PublicUserDto = components['schemas']['PublicUserDto'];

export function login(payload: LoginDto): Promise<AuthResponseDto> {
  return apiFetch<AuthResponseDto>(ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify(payload),
    skipUnauthorizedHandler: true,
  });
}

export function getMe(options?: RequestInit): Promise<PublicUserDto> {
  return apiFetch<PublicUserDto>(ENDPOINTS.AUTH.ME, options);
}
