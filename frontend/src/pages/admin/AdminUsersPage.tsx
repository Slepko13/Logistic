import UsersTable from '@/components/users/UsersTable';
import DeletedUsersTable from '@/components/users/DeletedUsersTable';
import EditUserDialog from '@/components/users/EditUserDialog';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import PageLoader from '@/components/common/PageLoader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    isCreateDialogOpen,
    setCreateDialogOpen,
    handleCreateUser,
    creatingUser,
    createError,
    handleToggleDriverStatus,
    togglingDriver,
    deletedUsers,
    handleRestoreUser,
    restoringUser,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">Користувачі</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4 text-emerald-400" />
          Додати користувача
        </Button>
      </div>

      <UsersTable
        users={users}
        isAdmin={isAdmin}
        currentUserId={user?.id}
        onDeleteRequest={openDeleteConfirm}
        onEditRequest={openEditDialog}
        onPromoteRequest={openPromoteConfirm}
        onToggleDriverRequest={handleToggleDriverStatus}
        actionError={usersActionError}
        togglingDriver={togglingDriver}
      />

      {isAdmin && deletedUsers.length > 0 && (
        <Card className="min-w-0 overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="deleted-users" className="border-none">
              <AccordionTrigger className="px-6 pt-0 pb-0 hover:no-underline hover:bg-transparent">
                <CardHeader className="px-0 py-0 text-left w-full border-none">
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    Видалені користувачі ({deletedUsers.length})
                  </CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-0 pt-6 [&>div]:pb-0">
                <CardContent className="px-0 py-0 min-w-0">
                  <DeletedUsersTable
                    users={deletedUsers}
                    onRestoreRequest={handleRestoreUser}
                    restoringUser={restoringUser}
                  />
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      )}

      <EditUserDialog
        open={!!editingUser}
        user={editingUser}
        loading={savingUser}
        error={editError}
        onOpenChange={(open: boolean) => !open && !savingUser && setEditingUser(null)}
        onSave={handleSaveUser}
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        loading={creatingUser}
        error={createError}
        onOpenChange={(open) => !open && !creatingUser && setCreateDialogOpen(false)}
        onSave={handleCreateUser}
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
