import { apiFetch } from './client';

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
  baggage_info: any[] | null;
  updated_at: string;
  updated_by_id: number | null;
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
  delivery_address: string;
  is_delivered: boolean;
  updated_at: string;
  updated_by_id: number | null;
  updated_by?: {
    first_name: string;
    last_name: string;
  };
}

export interface Trip {
  id: number;
  vehicle_id: number;
  departure_city: string | null;
  departure_date: string | null;
  arrival_city: string | null;
  arrival_date: string | null;
  status: string;
  created_at: string;
  vehicle: Vehicle;
  drivers: TripDriver[];
  seats: TripSeat[];
  parcels: TripParcel[];
}

export async function fetchActiveTrips(): Promise<Trip[]> {
  return apiFetch<Trip[]>('/api/trips');
}

export async function fetchTrip(id: number): Promise<Trip> {
  return apiFetch<Trip>(`/api/trips/${id}`);
}

export async function updateTrip(
  id: number,
  payload: {
    departure_city?: string;
    departure_date?: string;
    arrival_city?: string;
    arrival_date?: string;
  },
): Promise<Trip> {
  return apiFetch<Trip>(`/api/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function addTripDriver(tripId: number, userId: number): Promise<void> {
  await apiFetch(`/api/trips/${tripId}/drivers`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function removeTripDriver(tripId: number, userId: number): Promise<void> {
  await apiFetch(`/api/trips/${tripId}/drivers/${userId}`, {
    method: 'DELETE',
  });
}

export async function addTripSeat(tripId: number): Promise<TripSeat> {
  return apiFetch<TripSeat>(`/api/trips/${tripId}/seats`, {
    method: 'POST',
  });
}

export async function removeTripSeat(tripId: number, seatNumber: number): Promise<void> {
  await apiFetch(`/api/trips/${tripId}/seats/${seatNumber}`, {
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
    baggage_info?: any[] | null;
  },
): Promise<TripSeat> {
  return apiFetch<TripSeat>(`/api/trips/${tripId}/seats/${seatNumber}`, {
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
    delivery_address: string;
  },
): Promise<TripParcel> {
  return apiFetch<TripParcel>(`/api/trips/${tripId}/parcels`, {
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
    delivery_address?: string;
    is_delivered?: boolean;
  },
): Promise<TripParcel> {
  return apiFetch<TripParcel>(`/api/trips/${tripId}/parcels/${parcelId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function removeTripParcel(tripId: number, parcelId: number): Promise<void> {
  await apiFetch(`/api/trips/${tripId}/parcels/${parcelId}`, {
    method: 'DELETE',
  });
}

export async function completeTrip(tripId: number): Promise<Trip> {
  return apiFetch<Trip>(`/api/trips/${tripId}/complete`, {
    method: 'POST',
  });
}
