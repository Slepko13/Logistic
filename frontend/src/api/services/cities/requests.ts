import { apiFetch } from '../../client';
import { ENDPOINTS } from '../../endpoints';

export interface CityDto {
  id: number;
  name: string;
}
export interface CreateCityDto {
  name: string;
}
export interface UpdateCityDto {
  name: string;
}

export function getCities(): Promise<CityDto[]> {
  return apiFetch<CityDto[]>(ENDPOINTS.CITIES.GET_ALL);
}

export function createCity(payload: CreateCityDto): Promise<CityDto> {
  return apiFetch<CityDto>(ENDPOINTS.CITIES.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCity(id: number, payload: UpdateCityDto): Promise<CityDto> {
  return apiFetch<CityDto>(ENDPOINTS.CITIES.UPDATE(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteCity(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.CITIES.DELETE(id), {
    method: 'DELETE',
  });
}
