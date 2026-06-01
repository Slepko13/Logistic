import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  useGetTripParcels,
  useAddTripParcelMutation,
  useUpdateTripParcelMutation,
  useRemoveTripParcelMutation,
} from '@/api/services/trips/queries';
import { TripParcel } from '@/api/services/trips/requests';

export interface ParcelFormState {
  first_name: string;
  last_name: string;
  phone: string;
  weight: number;
  description: string;
  delivery_address: string;
}

export function useTripParcels(tripId: number) {
  // Parcel modal state
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  const [editingParcelId, setEditingParcelId] = useState<number | null>(null);
  const [parcelForm, setParcelForm] = useState<ParcelFormState>({
    first_name: '',
    last_name: '',
    phone: '',
    weight: 0,
    description: '',
    delivery_address: '',
  });

  const [deleteParcelConfirmOpen, setDeleteParcelConfirmOpen] = useState(false);
  const [parcelToDelete, setParcelToDelete] = useState<number | null>(null);

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
  const { data: parcelsData, isLoading: isLoadingParcels } = useGetTripParcels(tripId, {
    page: parcelPage,
    limit: parcelLimit,
    search: debouncedParcelSearchQuery || undefined,
    status: parcelStatusFilter !== 'all' ? parcelStatusFilter : undefined,
    sortBy: parcelSortConfig?.key,
    sortOrder: parcelSortConfig?.direction,
  });

  // Mutations
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

  const filteredAndSortedParcels = parcelsData?.data || [];

  return {
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

    // Mutations & Helper states for Presenter
    addParcelMutation,
    updateParcelMutation,
    removeParcelMutation,
    parcelToDelete,
  };
}
