import { apiFetch } from './client';

export interface City {
  id: number;
  name: string;
}

export type CreateCityPayload = Omit<City, 'id'>;
export type UpdateCityPayload = Partial<CreateCityPayload>;

export async function fetchCities(): Promise<City[]> {
  return apiFetch<City[]>('/api/cities');
}

export async function createCity(payload: CreateCityPayload): Promise<City> {
  return apiFetch<City>('/api/cities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCity(id: number, payload: UpdateCityPayload): Promise<City> {
  return apiFetch<City>(`/api/cities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function removeCity(id: number): Promise<void> {
  await apiFetch(`/api/cities/${id}`, {
    method: 'DELETE',
  });
}
