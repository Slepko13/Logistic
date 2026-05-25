import { apiFetch } from './client';
import { components } from './schema';

export type UserListItemDto = components['schemas']['UserListItemDto'];
export type UpdateUserDto = components['schemas']['UpdateUserDto'];
export type PublicUserDto = components['schemas']['PublicUserDto'];

export function fetchUsers(): Promise<UserListItemDto[]> {
  return apiFetch<UserListItemDto[]>('/api/users');
}

export function deleteUser(id: number): Promise<void> {
  return apiFetch<void>(`/api/users/${id}`, { method: 'DELETE' });
}

export function updateUser(id: number, payload: UpdateUserDto): Promise<PublicUserDto> {
  return apiFetch<PublicUserDto>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function promoteToAdmin(id: number): Promise<PublicUserDto> {
  return apiFetch<PublicUserDto>(`/api/users/${id}/promote-admin`, { method: 'PATCH' });
}
