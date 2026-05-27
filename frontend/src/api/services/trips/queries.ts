import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../queryKeys';
import {
  getTrips,
  getActiveTrips,
  getTripHistory,
  getTrip,
  updateTrip,
  completeTrip,
  addTripDriver,
  removeTripDriver,
  addTripSeat,
  updateTripSeat,
  removeTripSeat,
  addTripParcel,
  updateTripParcel,
  removeTripParcel,
  UpdateTripPayload,
} from './requests';
import toast from 'react-hot-toast';

export function useGetTrips() {
  return useQuery({
    queryKey: QUERY_KEYS.TRIPS.ALL,
    queryFn: getTrips,
  });
}

export function useGetActiveTrips() {
  return useQuery({
    queryKey: QUERY_KEYS.TRIPS.ACTIVE,
    queryFn: getActiveTrips,
  });
}

export function useGetTripHistory() {
  return useQuery({
    queryKey: QUERY_KEYS.TRIPS.HISTORY,
    queryFn: getTripHistory,
  });
}

export function useGetTrip(id: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.TRIPS.DETAIL(id),
    queryFn: () => getTrip(id),
    enabled,
  });
}

export function useUpdateTripMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTripPayload }) =>
      updateTrip(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.ACTIVE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(id) });
    },
  });
}

export function useCompleteTripMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeTrip,
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.ACTIVE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.HISTORY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
      toast.success('Рейс завершено');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка завершення рейсу'),
  });
}

export function useAddTripDriverMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, userId }: { tripId: number; userId: number }) =>
      addTripDriver(tripId, userId),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
      toast.success('Водія додано');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка додавання водія'),
  });
}

export function useRemoveTripDriverMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, userId }: { tripId: number; userId: number }) =>
      removeTripDriver(tripId, userId),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
      toast.success('Водія видалено');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка видалення водія'),
  });
}

export function useAddTripSeatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addTripSeat,
    onSuccess: (data, tripId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
      toast.success('Нове місце додано');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка додавання місця'),
  });
}

export function useUpdateTripSeatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      seatNumber,
      payload,
    }: {
      tripId: number;
      seatNumber: number;
      payload: Parameters<typeof updateTripSeat>[2];
    }) => updateTripSeat(tripId, seatNumber, payload),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка оновлення місця'),
  });
}

export function useRemoveTripSeatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, seatNumber }: { tripId: number; seatNumber: number }) =>
      removeTripSeat(tripId, seatNumber),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка видалення місця'),
  });
}

export function useAddTripParcelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      payload,
    }: {
      tripId: number;
      payload: Parameters<typeof addTripParcel>[1];
    }) => addTripParcel(tripId, payload),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка додавання передачі'),
  });
}

export function useUpdateTripParcelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      parcelId,
      payload,
    }: {
      tripId: number;
      parcelId: number;
      payload: Parameters<typeof updateTripParcel>[2];
    }) => updateTripParcel(tripId, parcelId, payload),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка оновлення передачі'),
  });
}

export function useRemoveTripParcelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, parcelId }: { tripId: number; parcelId: number }) =>
      removeTripParcel(tripId, parcelId),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRIPS.DETAIL(tripId) });
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка видалення передачі'),
  });
}
