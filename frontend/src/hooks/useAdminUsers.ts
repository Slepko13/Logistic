import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  useGetUsers,
  useGetDeletedUsers,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  usePromoteToAdminMutation,
  useToggleDriverStatusMutation,
  useRestoreUserMutation,
} from '@/api/services/users/queries';
import { UserListItemDto, UpdateUserDto, CreateUserDto } from '@/api/services/users/requests';
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
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [usersActionError, setUsersActionError] = useState<string | null>(null);

  // 1. Отримання користувачів
  const { data: users = [], isLoading: loading, error: fetchError } = useGetUsers();

  const error = fetchError ? (fetchError as Error).message : null;

  // 2. Видалення користувача
  const deleteMutation = useDeleteUserMutation();

  // 2.5. Відновлення користувача та Отримання видалених
  const { data: deletedUsers = [], isLoading: loadingDeleted } = useGetDeletedUsers();
  const restoreMutation = useRestoreUserMutation();

  const handleRestoreUser = useCallback(
    (userId: number) => {
      restoreMutation.mutate(userId);
    },
    [restoreMutation],
  );

  // 3. Підвищення до адміністратора
  const promoteMutation = usePromoteToAdminMutation();

  // 3.5. Перемикання статусу водія
  const toggleDriverMutation = useToggleDriverStatusMutation();

  // 4. Оновлення користувача
  const _updateMutation = useUpdateUserMutation();
  const updateMutation = useMemo(
    () => ({
      ..._updateMutation,
      mutate: (vars: { id: number; payload: UpdateUserDto }) => {
        _updateMutation.mutate(vars, {
          onSuccess: async (updatedUser) => {
            if (updatedUser.id === currentUser?.id) {
              await bootstrap();
            }
            setEditingUser(null);
          },
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Помилка оновлення';
            setEditError(msg);
          },
        });
      },
    }),
    [_updateMutation, currentUser?.id, bootstrap],
  );

  // 5. Створення користувача
  const _createMutation = useCreateUserMutation();
  const createMutation = useMemo(
    () => ({
      ..._createMutation,
      mutate: (payload: CreateUserDto) => {
        _createMutation.mutate(payload, {
          onSuccess: () => {
            setCreateDialogOpen(false);
          },
          onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Помилка створення';
            setCreateError(msg);
          },
        });
      },
    }),
    [_createMutation],
  );

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

  const handleToggleDriverStatus = useCallback(
    (targetUser: UserListItemDto) => {
      setUsersActionError(null);
      toggleDriverMutation.mutate(targetUser.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Помилка оновлення статусу водія';
          setUsersActionError(msg);
          toast.error(msg);
        },
      });
    },
    [toggleDriverMutation, queryClient],
  );

  const handleConfirmAction = useCallback(() => {
    if (!confirm) return;
    setUsersActionError(null);

    if (confirm.type === 'delete') {
      deleteMutation.mutate(confirm.userId, {
        onSuccess: () => {
          toast.success(`Користувача ${confirm.name} успішно видалено`);
          queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
          setConfirm(null);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Помилка видалення';
          setUsersActionError(msg);
          toast.error(msg);
          setConfirm(null);
        },
      });
    } else {
      promoteMutation.mutate(confirm.userId, {
        onSuccess: () => {
          toast.success(`Користувач ${confirm.name} тепер адміністратор`);
          queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
          setConfirm(null);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Помилка підвищення прав';
          setUsersActionError(msg);
          toast.error(msg);
          setConfirm(null);
        },
      });
    }
  }, [confirm, deleteMutation, promoteMutation, queryClient]);

  const handleSaveUser = useCallback(
    async (payload: UpdateUserDto) => {
      if (!editingUser) return;
      setEditError(null);
      updateMutation.mutate({ id: editingUser.id, payload });
    },
    [editingUser, updateMutation],
  );

  const handleCreateUser = useCallback(
    async (payload: CreateUserDto) => {
      setCreateError(null);
      createMutation.mutate(payload);
    },
    [createMutation],
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
    isCreateDialogOpen,
    setCreateDialogOpen,
    handleCreateUser,
    creatingUser: createMutation.isPending,
    createError,
    handleToggleDriverStatus,
    togglingDriver: toggleDriverMutation.isPending,
    deletedUsers,
    loadingDeleted,
    handleRestoreUser,
    restoringUser: restoreMutation.isPending,
  };
}
