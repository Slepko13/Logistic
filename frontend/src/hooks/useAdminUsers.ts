import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as usersApi from '@/api/users';
import { UserListItemDto, UpdateUserDto } from '@/api/users';
import { isAbortError } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

export interface ConfirmState {
  type: 'delete' | 'promote';
  userId: number;
  name: string;
}

export function useAdminUsers() {
  const { user: currentUser, bootstrap } = useAuth();
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [usersActionError, setUsersActionError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [editingUser, setEditingUser] = useState<UserListItemDto | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadUsers = useCallback(async (options?: RequestInit) => {
    return usersApi.fetchUsers(options);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const usersData = await loadUsers({ signal: controller.signal });
        setUsers(usersData);
      } catch (err: any) {
        if (!isAbortError(err)) setError(err.message || 'Error');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [loadUsers]);

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

  const handleConfirmAction = useCallback(async () => {
    if (!confirm) return;

    setUsersActionError(null);
    setConfirming(true);
    try {
      if (confirm.type === 'delete') {
        await usersApi.deleteUser(confirm.userId);
        toast.success(`Користувача ${confirm.name} успішно видалено`);
      } else {
        await usersApi.promoteToAdmin(confirm.userId);
        toast.success(`Користувач ${confirm.name} тепер адміністратор`);
      }
      setUsers(await loadUsers());
      setConfirm(null);
    } catch (err: any) {
      const msg = err.message || 'Error';
      setUsersActionError(msg);
      toast.error(msg);
      setConfirm(null);
    } finally {
      setConfirming(false);
    }
  }, [confirm, loadUsers]);

  const handleSaveUser = useCallback(async (payload: UpdateUserDto) => {
    if (!editingUser) return;

    setEditError(null);
    setSavingUser(true);
    try {
      const updatedUser = await usersApi.updateUser(editingUser.id, payload);
      setUsers((prev) =>
        prev.map((item) => (item.id === updatedUser.id ? { ...item, ...updatedUser } : item)),
      );
      if (updatedUser.id === currentUser?.id) {
        await bootstrap();
      }
      toast.success('Дані користувача успішно оновлено');
      setEditingUser(null);
    } catch (err: any) {
      const msg = err.message || 'Error';
      setEditError(msg);
      toast.error(msg);
    } finally {
      setSavingUser(false);
    }
  }, [editingUser, currentUser?.id, bootstrap]);

  return {
    users,
    loading,
    error,
    confirm,
    setConfirm,
    confirming,
    usersActionError,
    editingUser,
    setEditingUser,
    savingUser,
    editError,
    openDeleteConfirm,
    openPromoteConfirm,
    openEditDialog,
    handleConfirmAction,
    handleSaveUser,
  };
}
