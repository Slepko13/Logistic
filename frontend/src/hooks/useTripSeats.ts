import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  useUpdateTripSeatMutation,
  useAddTripSeatMutation,
  useRemoveTripSeatMutation,
} from '@/api/services/trips/queries';
import { Trip, TripSeat } from '@/api/services/trips/requests';

export interface SeatFormState {
  first_name: string;
  last_name: string;
  phone: string;
  boarding_address: string;
  baggage_info: { name: string; weight: number }[];
}

export function useTripSeats(tripId: number, trip: Trip | undefined) {
  // Seat modal state
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [editingSeatNumber, setEditingSeatNumber] = useState<number | null>(null);
  const [seatForm, setSeatForm] = useState<SeatFormState>({
    first_name: '',
    last_name: '',
    phone: '',
    boarding_address: '',
    baggage_info: [],
  });

  // Confirm modals state
  const [clearSeatConfirmOpen, setClearSeatConfirmOpen] = useState(false);
  const [seatToClear, setSeatToClear] = useState<number | null>(null);

  const [deleteSeatConfirmOpen, setDeleteSeatConfirmOpen] = useState(false);
  const [seatToDelete, setSeatToDelete] = useState<number | null>(null);

  const _updateSeatMutation = useUpdateTripSeatMutation();
  const updateSeatMutation = useMemo(
    () => ({
      ..._updateSeatMutation,
      mutateAsync: (vars: {
        seatNumber: number;
        payload: Record<string, unknown>;
        version?: number;
      }) => _updateSeatMutation.mutateAsync({ tripId, ...vars }),
      mutate: (vars: { seatNumber: number; payload: Record<string, unknown>; version?: number }) =>
        _updateSeatMutation.mutate(
          { tripId, ...vars },
          {
            onSuccess: () => {
              toast.success('Місце оновлено');
              setIsSeatModalOpen(false);
            },
          },
        ),
    }),
    [_updateSeatMutation, tripId],
  );

  const _addSeatMutation = useAddTripSeatMutation();
  const addSeatMutation = useMemo(
    () => ({
      ..._addSeatMutation,
      mutate: () => _addSeatMutation.mutate(tripId),
    }),
    [_addSeatMutation, tripId],
  );

  const _removeSeatMutation = useRemoveTripSeatMutation();
  const removeSeatMutation = useMemo(
    () => ({
      ..._removeSeatMutation,
      mutateAsync: (seatNumber: number, version?: number) =>
        _removeSeatMutation.mutateAsync({ tripId, seatNumber, version }),
    }),
    [_removeSeatMutation, tripId],
  );

  const handleOpenSeatModal = useCallback(
    (seat: TripSeat) => {
      setEditingSeatNumber(seat.seat_number);
      setSeatForm({
        first_name: seat.first_name || '',
        last_name: seat.last_name || '',
        phone: seat.phone || '',
        boarding_address: seat.boarding_address || trip?.departure_city || '',
        baggage_info: Array.isArray(seat.baggage_info)
          ? (seat.baggage_info as { name: string; weight: number }[])
          : [],
      });
      setIsSeatModalOpen(true);
    },
    [trip?.departure_city],
  );

  const handleAddBaggage = useCallback(() => {
    setSeatForm((prev) => ({
      ...prev,
      baggage_info: [...prev.baggage_info, { name: '', weight: 0 }],
    }));
  }, []);

  const handleRemoveBaggage = useCallback((index: number) => {
    setSeatForm((prev) => ({
      ...prev,
      baggage_info: prev.baggage_info.filter((_, i) => i !== index),
    }));
  }, []);

  const handleBaggageChange = useCallback(
    (index: number, field: 'name' | 'weight', value: string | number) => {
      setSeatForm((prev) => {
        const newBaggage = [...prev.baggage_info];
        newBaggage[index] = { ...newBaggage[index], [field]: value };
        return { ...prev, baggage_info: newBaggage };
      });
    },
    [],
  );

  const handleSaveSeat = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (editingSeatNumber !== null) {
        const seatVersion = trip?.seats.find((s) => s.seat_number === editingSeatNumber)?.version;
        updateSeatMutation.mutate({
          seatNumber: editingSeatNumber,
          version: seatVersion,
          payload: {
            first_name: seatForm.first_name || null,
            last_name: seatForm.last_name || null,
            phone: seatForm.phone || null,
            boarding_address: seatForm.boarding_address || null,
            baggage_info: seatForm.baggage_info.length > 0 ? seatForm.baggage_info : null,
          },
        });
      }
    },
    [editingSeatNumber, trip?.seats, seatForm, updateSeatMutation],
  );

  const handleClearSeatClick = useCallback((seatNumber: number) => {
    setSeatToClear(seatNumber);
    setClearSeatConfirmOpen(true);
  }, []);

  const executeClearSeat = useCallback(async () => {
    if (seatToClear !== null) {
      const seatVersion = trip?.seats.find((s) => s.seat_number === seatToClear)?.version;
      await updateSeatMutation.mutateAsync({
        seatNumber: seatToClear,
        version: seatVersion,
        payload: {
          first_name: null,
          last_name: null,
          phone: null,
          boarding_address: null,
          baggage_info: null,
        },
      });
      setClearSeatConfirmOpen(false);
      setSeatToClear(null);
    }
  }, [seatToClear, trip?.seats, updateSeatMutation]);

  const handleDeleteSeatClick = useCallback((seatNumber: number) => {
    setSeatToDelete(seatNumber);
    setDeleteSeatConfirmOpen(true);
  }, []);

  const executeDeleteSeat = useCallback(async () => {
    if (seatToDelete !== null) {
      const seatVersion = trip?.seats.find((s) => s.seat_number === seatToDelete)?.version;
      await removeSeatMutation.mutateAsync(seatToDelete, seatVersion);
      setDeleteSeatConfirmOpen(false);
      setSeatToDelete(null);
    }
  }, [seatToDelete, trip?.seats, removeSeatMutation]);

  return {
    isSeatModalOpen,
    setIsSeatModalOpen,
    editingSeatNumber,
    seatForm,
    setSeatForm,
    handleOpenSeatModal,
    handleAddBaggage,
    handleRemoveBaggage,
    handleBaggageChange,
    handleSaveSeat,
    addSeat: addSeatMutation.mutate,
    addingSeat: addSeatMutation.isPending,
    savingSeat: updateSeatMutation.isPending,

    // Clear Seat Confirmation
    clearSeatConfirmOpen,
    setClearSeatConfirmOpen,
    handleClearSeatClick,
    executeClearSeat,
    clearingSeat: updateSeatMutation.isPending,

    // Delete Seat Confirmation
    deleteSeatConfirmOpen,
    setDeleteSeatConfirmOpen,
    handleDeleteSeatClick,
    executeDeleteSeat,
    deletingSeat: removeSeatMutation.isPending,

    // Mutations & Helper states for Presenter
    updateSeatMutation,
    addSeatMutation,
    removeSeatMutation,
  };
}
