import UsersTable from '@/components/users/UsersTable';
import EditUserDialog from '@/components/users/EditUserDialog';
import PageLoader from '@/components/common/PageLoader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useAdminUsers } from '@/hooks/useAdminUsers';

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  
  const {
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
  } = useAdminUsers();

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
