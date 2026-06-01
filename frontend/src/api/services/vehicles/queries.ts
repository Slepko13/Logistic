import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../queryKeys';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  UpdateVehicleDto,
} from './requests';
import toast from 'react-hot-toast';

export function useGetVehicles() {
  return useQuery({
    queryKey: QUERY_KEYS.VEHICLES.ALL,
    queryFn: getVehicles,
  });
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES.ALL });
      toast.success('Автобус додано');
    },
  });
}

export function useUpdateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateVehicleDto }) =>
      updateVehicle(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES.ALL });
      toast.success('Автобус оновлено');
    },
  });
}

export function useDeleteVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES.ALL });
      toast.success('Автобус видалено');
    },
  });
}
