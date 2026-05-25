import { apiFetch } from './client';

export interface Vehicle {
  id: number;
  name: string;
  plate_number: string | null;
}

export type CreateVehiclePayload = Omit<Vehicle, 'id'>;
export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export async function fetchVehicles(): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>('/api/vehicles');
}

export async function fetchVehicle(id: number): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/api/vehicles/${id}`);
}

export async function createVehicle(payload: CreateVehiclePayload): Promise<Vehicle> {
  return apiFetch<Vehicle>('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateVehicle(id: number, payload: UpdateVehiclePayload): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/api/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function removeVehicle(id: number): Promise<void> {
  await apiFetch(`/api/vehicles/${id}`, {
    method: 'DELETE',
  });
}
