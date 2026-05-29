import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../queryKeys';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  promoteToAdmin,
  toggleDriverStatus,
  getDeletedUsers,
  restoreUser,
  UpdateUserDto,
} from './requests';
import toast from 'react-hot-toast';

export function useGetUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.ALL,
    queryFn: getUsers,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('Користувача додано успішно');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка додавання користувача'),
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserDto }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('Користувача оновлено');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка оновлення користувача'),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('Користувача видалено');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка видалення користувача'),
  });
}

export function usePromoteToAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promoteToAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('Користувача зроблено адміністратором');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка оновлення ролі'),
  });
}

export function useToggleDriverStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleDriverStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('Статус водія оновлено');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка оновлення статусу водія'),
  });
}

export function useGetDeletedUsers() {
  return useQuery({
    queryKey: [...QUERY_KEYS.USERS.ALL, 'deleted'],
    queryFn: getDeletedUsers,
  });
}

export function useRestoreUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      toast.success('Користувача успішно відновлено');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка відновлення користувача'),
  });
}
