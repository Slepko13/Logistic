import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../queryKeys';
import { getCities, createCity, updateCity, deleteCity, UpdateCityDto } from './requests';
import toast from 'react-hot-toast';

export function useGetCities() {
  return useQuery({
    queryKey: QUERY_KEYS.CITIES.ALL,
    queryFn: getCities,
  });
}

export function useCreateCityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CITIES.ALL });
      toast.success('Місто додано успішно');
    },
  });
}

export function useUpdateCityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCityDto }) =>
      updateCity(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CITIES.ALL });
      toast.success('Місто оновлено успішно');
    },
  });
}

export function useDeleteCityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CITIES.ALL });
      toast.success('Місто видалено успішно');
    },
  });
}
