import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import UsersTable from '@/components/users/UsersTable';
import EditUserDialog from '@/components/users/EditUserDialog';
import PageLoader from '@/components/common/PageLoader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { isAbortError } from '@/api/client';
import * as usersApi from '@/api/users';
import { UserListItemDto, UpdateUserDto } from '@/api/users';

interface ConfirmState {
  type: 'delete' | 'promote';
  userId: number;
  name: string;
}

export default function AdminUsersPage() {
  const { user, isAdmin, bootstrap } = useAuth();
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersActionError, setUsersActionError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItemDto | null>(null);
  const [confirming, setConfirming] = useState(false);
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

  function openDeleteConfirm(targetUser: UserListItemDto) {
    setConfirm({
      type: 'delete',
      userId: targetUser.id,
      name: `${targetUser.last_name} ${targetUser.first_name}`,
    });
  }

  function openPromoteConfirm(targetUser: UserListItemDto) {
    setConfirm({
      type: 'promote',
      userId: targetUser.id,
      name: `${targetUser.last_name} ${targetUser.first_name}`,
    });
  }

  function openEditDialog(targetUser: UserListItemDto) {
    setEditError(null);
    setEditingUser(targetUser);
  }

  async function handleConfirmAction() {
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
  }

  async function handleSaveUser(payload: UpdateUserDto) {
    if (!editingUser) return;

    setEditError(null);
    setSavingUser(true);
    try {
      const updatedUser = await usersApi.updateUser(editingUser.id, payload);
      setUsers((prev) =>
        prev.map((item) => (item.id === updatedUser.id ? { ...item, ...updatedUser } : item)),
      );
      if (updatedUser.id === user?.id) {
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
  }

  const confirmConfig =
    confirm?.type === 'delete'
      ? {
          title: 'Видалити користувача?',
          description: `Ви впевнені, що хочете видалити ${confirm.name}? Цю дію не можна скасувати.`,
          confirmLabel: 'Видалити',
          confirmVariant: 'destructive' as const,
        }
      : confirm?.type === 'promote'
        ? {
            title: 'Надати права адміністратора?',
            description: `Користувач ${confirm.name} отримає повний адмін-доступ до системи.`,
            confirmLabel: 'Надати права',
            confirmVariant: 'default' as const,
          }
        : null;

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <p className="text-destructive">Помилка: {error}</p>;
  }

  return (
    <div className="space-y-6">
      <UsersTable
        users={users}
        isAdmin={isAdmin}
        currentUserId={user?.id}
        onDeleteRequest={openDeleteConfirm}
        onEditRequest={openEditDialog}
        onPromoteRequest={openPromoteConfirm}
        actionError={usersActionError}
      />

      <EditUserDialog
        open={!!editingUser}
        user={editingUser}
        loading={savingUser}
        error={editError}
        onOpenChange={(open: boolean) => !open && !savingUser && setEditingUser(null)}
        onSave={handleSaveUser}
      />

      {confirmConfig && (
        <ConfirmDialog
          open={!!confirm}
          onOpenChange={(open: boolean) => !open && !confirming && setConfirm(null)}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.confirmLabel}
          confirmVariant={confirmConfig.confirmVariant}
          onConfirm={handleConfirmAction}
          loading={confirming}
        />
      )}
    </div>
  );
}
