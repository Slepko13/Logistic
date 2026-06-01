import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  useGetTrip,
  useAddTripDriverMutation,
  useRemoveTripDriverMutation,
  useUpdateTripSeatMutation,
  useAddTripSeatMutation,
  useRemoveTripSeatMutation,
  useAddTripParcelMutation,
  useUpdateTripParcelMutation,
  useRemoveTripParcelMutation,
  useCompleteTripMutation,
  useGetTripParcels,
} from '@/api/services/trips/queries';
import { TripSeat, TripParcel } from '@/api/services/trips/requests';
import { useGetUsers } from '@/api/services/users/queries';

export interface SeatFormState {
  first_name: string;
  last_name: string;
  phone: string;
  boarding_address: string;
  baggage_info: { name: string; weight: number }[];
}

export interface ParcelFormState {
  first_name: string;
  last_name: string;
  phone: string;
  weight: number;
  description: string;
  delivery_address: string;
}

export function useTripDetail(tripId: number) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

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

  // Parcel modal state
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  const [editingParcelId, setEditingParcelId] = useState<number | null>(null);

  // Entity history modal state
  const [isEntityHistoryOpen, setIsEntityHistoryOpen] = useState(false);
  const [entityHistorySearchQuery, setEntityHistorySearchQuery] = useState<string | null>(null);
  const [entityHistoryName, setEntityHistoryName] = useState<string>('');

  const [parcelForm, setParcelForm] = useState<ParcelFormState>({
    first_name: '',
    last_name: '',
    phone: '',
    weight: 0,
    description: '',
    delivery_address: '',
  });

  // Derived states
  const [deleteParcelConfirmOpen, setDeleteParcelConfirmOpen] = useState(false);
  const [parcelToDelete, setParcelToDelete] = useState<number | null>(null);

  const [completeTripConfirmOpen, setCompleteTripConfirmOpen] = useState(false);

  // Parcel Filter & Sort State
  const [parcelSearchQuery, setParcelSearchQuery] = useState('');
  const [parcelStatusFilter, setParcelStatusFilter] = useState<string>('all');
  const [parcelSortConfig, setParcelSortConfig] = useState<{
    key: 'sender' | 'phone' | 'status';
    direction: 'asc' | 'desc';
  } | null>(null);

  const [parcelPage, setParcelPage] = useState(1);
  const [parcelLimit, setParcelLimit] = useState(10);
  const [debouncedParcelSearchQuery, setDebouncedParcelSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedParcelSearchQuery(parcelSearchQuery);
      setParcelPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [parcelSearchQuery]);

  // Fetch API Queries
  const { data: trip, isLoading: isLoadingTrip } = useGetTrip(tripId);

  const { data: parcelsData, isLoading: isLoadingParcels } = useGetTripParcels(tripId, {
    page: parcelPage,
    limit: parcelLimit,
    search: debouncedParcelSearchQuery || undefined,
    status: parcelStatusFilter !== 'all' ? parcelStatusFilter : undefined,
    sortBy: parcelSortConfig?.key,
    sortOrder: parcelSortConfig?.direction,
  });

  const { data: allUsers } = useGetUsers();

  // Mutations
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

  const _addParcelMutation = useAddTripParcelMutation();
  const addParcelMutation = useMemo(
    () => ({
      ..._addParcelMutation,
      mutate: (payload: ParcelFormState) =>
        _addParcelMutation.mutate(
          { tripId, payload },
          {
            onSuccess: () => {
              toast.success('Передачу додано');
              setIsParcelModalOpen(false);
            },
          },
        ),
    }),
    [_addParcelMutation, tripId],
  );

  const _updateParcelMutation = useUpdateTripParcelMutation();
  const updateParcelMutation = useMemo(
    () => ({
      ..._updateParcelMutation,
      mutate: (vars: { parcelId: number; payload: Record<string, unknown>; version?: number }) =>
        _updateParcelMutation.mutate(
          { tripId, ...vars },
          {
            onSuccess: () => {
              toast.success('Передачу оновлено');
              setIsParcelModalOpen(false);
            },
          },
        ),
    }),
    [_updateParcelMutation, tripId],
  );

  const _removeParcelMutation = useRemoveTripParcelMutation();
  const removeParcelMutation = useMemo(
    () => ({
      ..._removeParcelMutation,
      mutateAsync: (parcelId: number, version?: number) =>
        _removeParcelMutation.mutateAsync(
          { tripId, parcelId, version },
          {
            onSuccess: () => {
              toast.success('Передачу видалено');
              setDeleteParcelConfirmOpen(false);
              setParcelToDelete(null);
            },
          },
        ),
    }),
    [_removeParcelMutation, tripId],
  );

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

  // Handlers
  const handleParcelSort = useCallback((key: 'sender' | 'phone' | 'status') => {
    setParcelSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

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

  const handleOpenParcelModal = useCallback((parcel?: TripParcel) => {
    if (parcel) {
      setEditingParcelId(parcel.id);
      setParcelForm({
        first_name: parcel.first_name,
        last_name: parcel.last_name,
        phone: parcel.phone,
        weight: parcel.weight,
        description: parcel.description || '',
        delivery_address: parcel.delivery_address,
      });
    } else {
      setEditingParcelId(null);
      setParcelForm({
        first_name: '',
        last_name: '',
        phone: '',
        weight: 0,
        description: '',
        delivery_address: '',
      });
    }
    setIsParcelModalOpen(true);
  }, []);

  const handleSaveParcel = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (editingParcelId !== null) {
        const parcelVersion = parcelsData?.data.find((p) => p.id === editingParcelId)?.version;
        updateParcelMutation.mutate({
          parcelId: editingParcelId,
          version: parcelVersion,
          payload: parcelForm as unknown as Record<string, unknown>,
        });
      } else {
        addParcelMutation.mutate(parcelForm);
      }
    },
    [editingParcelId, parcelsData?.data, parcelForm, updateParcelMutation, addParcelMutation],
  );

  const handleToggleParcelDelivered = useCallback(
    (parcel: TripParcel) => {
      updateParcelMutation.mutate({
        parcelId: parcel.id,
        version: parcel.version,
        payload: { is_delivered: !parcel.is_delivered },
      });
    },
    [updateParcelMutation],
  );

  const handleDeleteParcelClick = useCallback((parcelId: number) => {
    setParcelToDelete(parcelId);
    setDeleteParcelConfirmOpen(true);
  }, []);

  const executeDeleteParcel = useCallback(async () => {
    if (parcelToDelete !== null) {
      const parcelVersion = parcelsData?.data.find((p) => p.id === parcelToDelete)?.version;
      await removeParcelMutation.mutateAsync(parcelToDelete, parcelVersion);
    }
  }, [parcelToDelete, parcelsData?.data, removeParcelMutation]);

  const executeCompleteTrip = useCallback(async () => {
    await completeTripMutation.mutate();
    setCompleteTripConfirmOpen(false);
  }, [completeTripMutation]);

  // Derived states
  const filteredAndSortedParcels = parcelsData?.data || [];
  const isClosed = trip?.status === 'completed';
  const availableDrivers = allUsers?.filter(
    (u) => u.is_driver && !trip?.drivers.some((d) => d.user_id === u.id),
  );

  return {
    currentUser,
    trip,
    isLoadingTrip,
    isClosed,

    // Drivers
    selectedDriverId,
    setSelectedDriverId,
    availableDrivers,
    addingDriver: addDriverMutation.isPending,
    removingDriver: removeDriverMutation.isPending,
    addDriver: addDriverMutation.mutate,
    removeDriver: removeDriverMutation.mutate,

    // Seats
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
    savingSeat: updateSeatMutation.isPending,
    addingSeat: addSeatMutation.isPending,
    addSeat: addSeatMutation.mutate,

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

    // Parcels
    parcelsData,
    parcels: filteredAndSortedParcels,
    isLoadingParcels,
    isParcelModalOpen,
    setIsParcelModalOpen,
    editingParcelId,
    parcelForm,
    setParcelForm,
    handleOpenParcelModal,
    handleSaveParcel,
    savingParcel: addParcelMutation.isPending || updateParcelMutation.isPending,
    handleToggleParcelDelivered,
    handleDeleteParcelClick,
    deleteParcelConfirmOpen,
    setDeleteParcelConfirmOpen,
    executeDeleteParcel,
    deletingParcel: removeParcelMutation.isPending,

    // Parcel Search & Pagination
    parcelSearchQuery,
    setParcelSearchQuery,
    parcelStatusFilter,
    setParcelStatusFilter,
    parcelSortConfig,
    handleParcelSort,
    parcelPage,
    setParcelPage,
    parcelLimit,
    setParcelLimit,
    totalPages: parcelsData?.totalPages || 1,
    totalParcels: parcelsData?.total || 0,

    // Trip Completion
    completeTripConfirmOpen,
    setCompleteTripConfirmOpen,
    executeCompleteTrip,
    completingTrip: completeTripMutation.isPending,

    // Entity History Modals
    isEntityHistoryOpen,
    setIsEntityHistoryOpen,
    entityHistorySearchQuery,
    setEntityHistorySearchQuery,
    entityHistoryName,
    setEntityHistoryName,

    // Mutations & Helper states for Presenter
    addDriverMutation,
    removeDriverMutation,
    updateSeatMutation,
    addSeatMutation,
    removeSeatMutation,
    addParcelMutation,
    updateParcelMutation,
    removeParcelMutation,
    completeTripMutation,
    parcelToDelete,
  };
}
