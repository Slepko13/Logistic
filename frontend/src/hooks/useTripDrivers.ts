import { useState, useMemo } from 'react';
import {
  useAddTripDriverMutation,
  useRemoveTripDriverMutation,
} from '@/api/services/trips/queries';
import { Trip } from '@/api/services/trips/requests';
import { useGetUsers } from '@/api/services/users/queries';

export function useTripDrivers(tripId: number, trip: Trip | undefined) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const { data: allUsers } = useGetUsers();

  const _addDriverMutation = useAddTripDriverMutation();
  const addDriverMutation = useMemo(
    () => ({
      ..._addDriverMutation,
      mutate: (userId: number) =>
        _addDriverMutation.mutate({ tripId, userId }, { onSuccess: () => setSelectedDriverId('') }),
    }),
    [_addDriverMutation, tripId],
  );

  const _removeDriverMutation = useRemoveTripDriverMutation();
  const removeDriverMutation = useMemo(
    () => ({
      ..._removeDriverMutation,
      mutate: (userId: number) => _removeDriverMutation.mutate({ tripId, userId }),
    }),
    [_removeDriverMutation, tripId],
  );

  const availableDrivers = useMemo(() => {
    return allUsers?.filter((u) => u.is_driver && !trip?.drivers.some((d) => d.user_id === u.id));
  }, [allUsers, trip?.drivers]);

  return {
    selectedDriverId,
    setSelectedDriverId,
    availableDrivers,
    addingDriver: addDriverMutation.isPending,
    removingDriver: removeDriverMutation.isPending,
    addDriver: addDriverMutation.mutate,
    removeDriver: removeDriverMutation.mutate,
    addDriverMutation,
    removeDriverMutation,
  };
}
