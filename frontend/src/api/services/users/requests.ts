import { apiFetch } from '../../client';
import { components } from '../../schema';
import { ENDPOINTS } from '../../endpoints';

export type UserListItemDto = components['schemas']['UserListItemDto'];
export type UpdateUserDto = components['schemas']['UpdateUserDto'];
export type CreateUserDto = components['schemas']['CreateUserDto'];
export type PublicUserDto = components['schemas']['PublicUserDto'];

export function getUsers(): Promise<UserListItemDto[]> {
  return apiFetch<UserListItemDto[]>(ENDPOINTS.USERS.GET_ALL);
}

export function createUser(payload: CreateUserDto): Promise<PublicUserDto> {
  return apiFetch<PublicUserDto>(ENDPOINTS.USERS.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.USERS.DELETE(id), { method: 'DELETE' });
}

export function updateUser(id: number, payload: UpdateUserDto): Promise<PublicUserDto> {
  return apiFetch<PublicUserDto>(ENDPOINTS.USERS.UPDATE(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function promoteToAdmin(id: number): Promise<PublicUserDto> {
  return apiFetch<PublicUserDto>(ENDPOINTS.USERS.PROMOTE_ADMIN(id), { method: 'PATCH' });
}
