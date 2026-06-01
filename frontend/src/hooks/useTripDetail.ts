import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGetTrip, useCompleteTripMutation } from '@/api/services/trips/queries';
import { useTripDrivers } from './useTripDrivers';
import { useTripSeats } from './useTripSeats';
import { useTripParcels } from './useTripParcels';

export function useTripDetail(tripId: number) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Fetch API Queries
  const { data: trip, isLoading: isLoadingTrip } = useGetTrip(tripId);

  // Derived states
  const isClosed = trip?.status === 'completed';

  // Delegate sub-domains to specialized hooks
  const drivers = useTripDrivers(tripId, trip);
  const seats = useTripSeats(tripId, trip);
  const parcels = useTripParcels(tripId);

  // Trip Completion
  const [completeTripConfirmOpen, setCompleteTripConfirmOpen] = useState(false);

  const _completeTripMutation = useCompleteTripMutation();
  const completeTripMutation = useMemo(
    () => ({
      ..._completeTripMutation,
      mutate: () =>
        _completeTripMutation.mutate(
          { tripId, version: trip?.version },
          {
            onSuccess: () => {
              navigate('/');
            },
          },
        ),
    }),
    [_completeTripMutation, tripId, trip?.version, navigate],
  );

  const executeCompleteTrip = useCallback(async () => {
    await completeTripMutation.mutate();
    setCompleteTripConfirmOpen(false);
  }, [completeTripMutation]);

  // Entity history modal state
  const [isEntityHistoryOpen, setIsEntityHistoryOpen] = useState(false);
  const [entityHistorySearchQuery, setEntityHistorySearchQuery] = useState<string | null>(null);
  const [entityHistoryName, setEntityHistoryName] = useState<string>('');

  return {
    currentUser,
    trip,
    isLoadingTrip,
    isClosed,

    // Drivers Sub-Hook API
    ...drivers,

    // Seats Sub-Hook API
    ...seats,

    // Parcels Sub-Hook API
    ...parcels,

    // Trip Completion
    completeTripConfirmOpen,
    setCompleteTripConfirmOpen,
    executeCompleteTrip,
    completingTrip: completeTripMutation.isPending,
    completeTripMutation,

    // Entity History Modals
    isEntityHistoryOpen,
    setIsEntityHistoryOpen,
    entityHistorySearchQuery,
    setEntityHistorySearchQuery,
    entityHistoryName,
    setEntityHistoryName,
  };
}
