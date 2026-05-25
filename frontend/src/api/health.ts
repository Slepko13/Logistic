import { apiFetch } from './client';
import { components } from './schema';

export type HealthResponseDto = components['schemas']['HealthResponseDto'];

export function fetchHealth(options?: RequestInit): Promise<HealthResponseDto> {
  return apiFetch<HealthResponseDto>('/api/health', options);
}
