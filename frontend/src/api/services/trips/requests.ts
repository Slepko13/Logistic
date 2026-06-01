import { apiFetch } from '../../client';
import { ENDPOINTS } from '../../endpoints';

export interface Vehicle {
  id: number;
  name: string;
  plate_number: string | null;
}

export interface TripDriver {
  trip_id: number;
  user_id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export interface TripSeat {
  id: number;
  trip_id: number;
  seat_number: number;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  baggage_info: unknown[] | null;
  boarding_address: string | null;
  updated_at: string;
  updated_by_id: number | null;
  version: number;
  updated_by?: {
    first_name: string;
    last_name: string;
  };
}

export interface TripParcel {
  id: number;
  trip_id: number;
  parcel_number: number;
  first_name: string;
  last_name: string;
  phone: string;
  weight: number;
  description: string | null;
  delivery_address: string;
  is_delivered: boolean;
  updated_at: string;
  updated_by_id: number | null;
  version: number;
  updated_by?: {
    first_name: string;
    last_name: string;
  };
}

export interface TripHistory {
  id: number;
  trip_id: number;
  user_id: number | null;
  action: string;
  details: string | null;
  changes?: Record<string, unknown> | null;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

export interface UpdateTripPayload {
  departure_city?: string | null;
  departure_date?: string | null;
  arrival_city?: string | null;
  arrival_date?: string | null;
  vehicle_id?: number;
  driverIds?: number[];
  version?: number;
}

export interface GetTripParcelsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetTripHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedParcels {
  data: TripParcel[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PaginatedTrips {
  data: Trip[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PaginatedHistory {
  data: TripHistory[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetTripAuditHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  filterAction?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Trip {
  id: number;
  vehicle_id: number;
  departure_city: string | null;
  departure_date: string | null;
  arrival_city: string | null;
  arrival_date: string | null;
  status: string;
  version: number;
  created_at: string;
  vehicle: Vehicle;
  drivers: TripDriver[];
  seats: TripSeat[];
  parcels: TripParcel[];
  history?: TripHistory[];
}

export async function getActiveTrips(): Promise<Trip[]> {
  return apiFetch<Trip[]>(ENDPOINTS.TRIPS.GET_ALL);
}

export async function getTripHistory(params?: GetTripHistoryParams): Promise<PaginatedTrips> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<PaginatedTrips>(`${ENDPOINTS.TRIPS.GET_HISTORY}${queryString}`);
}

export async function getTrips(): Promise<Trip[]> {
  return apiFetch<Trip[]>(ENDPOINTS.TRIPS.GET_ALL);
}

export async function getTripAuditHistory(
  tripId: number,
  params?: GetTripAuditHistoryParams,
): Promise<PaginatedHistory> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.filterAction) query.append('filterAction', params.filterAction);
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

  const qs = query.toString();
  const url = `${ENDPOINTS.TRIPS.GET_BY_ID(tripId)}/history${qs ? `?${qs}` : ''}`;
  return apiFetch<PaginatedHistory>(url);
}

export async function createTrip(vehicle_id: number, seatsCount?: number): Promise<Trip> {
  return apiFetch<Trip>(ENDPOINTS.TRIPS.CREATE, {
    method: 'POST',
    body: JSON.stringify({ vehicle_id, seatsCount }),
  });
}

export async function deleteTrip(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.TRIPS.DELETE(id), {
    method: 'DELETE',
  });
}

export async function getTrip(id: number): Promise<Trip> {
  return apiFetch<Trip>(ENDPOINTS.TRIPS.GET_BY_ID(id));
}

export async function updateTrip(id: number, payload: UpdateTripPayload): Promise<Trip> {
  return apiFetch<Trip>(ENDPOINTS.TRIPS.UPDATE(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function addTripDriver(tripId: number, userId: number): Promise<void> {
  await apiFetch(ENDPOINTS.TRIPS.ADD_DRIVER(tripId), {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function removeTripDriver(tripId: number, userId: number): Promise<void> {
  await apiFetch(ENDPOINTS.TRIPS.REMOVE_DRIVER(tripId, userId), {
    method: 'DELETE',
  });
}

export async function addTripSeat(tripId: number): Promise<TripSeat> {
  return apiFetch<TripSeat>(ENDPOINTS.TRIPS.BOOK_SEAT(tripId), {
    method: 'POST',
  });
}

export async function removeTripSeat(
  tripId: number,
  seatNumber: number,
  version?: number,
): Promise<void> {
  const query = version !== undefined ? `?version=${version}` : '';
  await apiFetch(`${ENDPOINTS.TRIPS.CLEAR_SEAT(tripId, seatNumber)}${query}`, {
    method: 'DELETE',
  });
}

export async function updateTripSeat(
  tripId: number,
  seatNumber: number,
  payload: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    baggage_info?: unknown[] | null;
    boarding_address?: string | null;
    version?: number;
  },
): Promise<TripSeat> {
  return apiFetch<TripSeat>(ENDPOINTS.TRIPS.UPDATE_SEAT(tripId, seatNumber), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function addTripParcel(
  tripId: number,
  payload: {
    first_name: string;
    last_name: string;
    phone: string;
    weight: number;
    description?: string;
    delivery_address: string;
  },
): Promise<TripParcel> {
  return apiFetch<TripParcel>(ENDPOINTS.TRIPS.ADD_PARCEL(tripId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTripParcel(
  tripId: number,
  parcelId: number,
  payload: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    weight?: number;
    description?: string;
    delivery_address?: string;
    is_delivered?: boolean;
    version?: number;
  },
): Promise<TripParcel> {
  return apiFetch<TripParcel>(ENDPOINTS.TRIPS.UPDATE_PARCEL(tripId, parcelId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function removeTripParcel(
  tripId: number,
  parcelId: number,
  version?: number,
): Promise<void> {
  const query = version !== undefined ? `?version=${version}` : '';
  await apiFetch(`${ENDPOINTS.TRIPS.DELETE_PARCEL(tripId, parcelId)}${query}`, {
    method: 'DELETE',
  });
}

export async function completeTrip(tripId: number, version?: number): Promise<Trip> {
  const query = version !== undefined ? `?version=${version}` : '';
  return apiFetch<Trip>(`${ENDPOINTS.TRIPS.COMPLETE(tripId)}${query}`, {
    method: 'POST',
  });
}

export async function getTripParcels(
  tripId: number,
  params: GetTripParcelsParams,
): Promise<PaginatedParcels> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);

  const qs = query.toString();
  const url = `${ENDPOINTS.TRIPS.GET_PARCELS(tripId)}${qs ? `?${qs}` : ''}`;
  return apiFetch<PaginatedParcels>(url);
}
