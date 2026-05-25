import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as usersApi from '@/api/users';
import { UserListItemDto, UpdateUserDto } from '@/api/users';
import { useAuth } from '@/context/AuthContext';

export interface ConfirmState {
  type: 'delete' | 'promote';
  userId: number;
  name: string;
}

export function useAdminUsers() {
  const { user: currentUser, bootstrap } = useAuth();
  const queryClient = useQueryClient();

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItemDto | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [usersActionError, setUsersActionError] = useState<string | null>(null);

  // 1. Отримання користувачів
  const {
    data: users = [],
    isLoading: loading,
    error: fetchError,
  } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => usersApi.fetchUsers(),
  });

  const error = fetchError ? (fetchError as Error).message : null;

  // 2. Видалення користувача
  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: (_, deletedId) => {
      const deletedName = confirm?.userId === deletedId ? confirm.name : '';
      toast.success(`Користувача ${deletedName} успішно видалено`);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setConfirm(null);
    },
    onError: (err: any) => {
      const msg = err.message || 'Помилка видалення';
      setUsersActionError(msg);
      toast.error(msg);
      setConfirm(null);
    },
  });

  // 3. Підвищення до адміністратора
  const promoteMutation = useMutation({
    mutationFn: (id: number) => usersApi.promoteToAdmin(id),
    onSuccess: (_, promotedId) => {
      const promotedName = confirm?.userId === promotedId ? confirm.name : '';
      toast.success(`Користувач ${promotedName} тепер адміністратор`);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setConfirm(null);
    },
    onError: (err: any) => {
      const msg = err.message || 'Помилка підвищення прав';
      setUsersActionError(msg);
      toast.error(msg);
      setConfirm(null);
    },
  });

  // 4. Оновлення користувача
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserDto }) =>
      usersApi.updateUser(id, payload),
    onSuccess: async (updatedUser) => {
      toast.success('Дані користувача успішно оновлено');
      if (updatedUser.id === currentUser?.id) {
        await bootstrap();
      }
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      const msg = err.message || 'Помилка оновлення';
      setEditError(msg);
      toast.error(msg);
    },
  });

  const openDeleteConfirm = useCallback((targetUser: UserListItemDto) => {
    setConfirm({
      type: 'delete',
      userId: targetUser.id,
      name: `${targetUser.last_name} ${targetUser.first_name}`,
    });
  }, []);

  const openPromoteConfirm = useCallback((targetUser: UserListItemDto) => {
    setConfirm({
      type: 'promote',
      userId: targetUser.id,
      name: `${targetUser.last_name} ${targetUser.first_name}`,
    });
  }, []);

  const openEditDialog = useCallback((targetUser: UserListItemDto) => {
    setEditError(null);
    setEditingUser(targetUser);
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (!confirm) return;
    setUsersActionError(null);

    if (confirm.type === 'delete') {
      deleteMutation.mutate(confirm.userId);
    } else {
      promoteMutation.mutate(confirm.userId);
    }
  }, [confirm, deleteMutation, promoteMutation]);

  const handleSaveUser = useCallback(
    async (payload: UpdateUserDto) => {
      if (!editingUser) return;
      setEditError(null);
      updateMutation.mutate({ id: editingUser.id, payload });
    },
    [editingUser, updateMutation],
  );

  return {
    users,
    loading,
    error,
    confirm,
    setConfirm,
    confirming: deleteMutation.isPending || promoteMutation.isPending,
    usersActionError,
    editingUser,
    setEditingUser,
    savingUser: updateMutation.isPending,
    editError,
    openDeleteConfirm,
    openPromoteConfirm,
    openEditDialog,
    handleConfirmAction,
    handleSaveUser,
  };
}
