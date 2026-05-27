import { apiFetch } from '../../client';
import { ENDPOINTS } from '../../endpoints';

export interface VehicleDto {
  id: number;
  name: string;
  plate_number: string | null;
}
export interface CreateVehicleDto {
  name: string;
  plate_number: string | null;
}
export interface UpdateVehicleDto {
  name?: string;
  plate_number?: string | null;
}

export function getVehicles(): Promise<VehicleDto[]> {
  return apiFetch<VehicleDto[]>(ENDPOINTS.VEHICLES.GET_ALL);
}

export function createVehicle(payload: CreateVehicleDto): Promise<VehicleDto> {
  return apiFetch<VehicleDto>(ENDPOINTS.VEHICLES.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateVehicle(id: number, payload: UpdateVehicleDto): Promise<VehicleDto> {
  return apiFetch<VehicleDto>(ENDPOINTS.VEHICLES.UPDATE(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteVehicle(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.VEHICLES.DELETE(id), { method: 'DELETE' });
}
