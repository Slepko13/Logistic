import { RefreshCw } from 'lucide-react';
import { ROLE_LABELS, UserRoleType } from '@/constants/userRole';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserListItemDto } from '@/api/services/users/requests';
import { formatDate } from '@/lib/utils';

export interface DeletedUsersTableProps {
  users: UserListItemDto[];
  onRestoreRequest: (id: number) => void;
  restoringUser?: boolean;
}

export default function DeletedUsersTable({
  users,
  onRestoreRequest,
  restoringUser,
}: DeletedUsersTableProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">Віддалених користувачів немає.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="[&_td]:whitespace-normal [&_th]:whitespace-normal">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Прізвище</TableHead>
            <TableHead>Імʼя</TableHead>
            <TableHead>Телефон</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Дата реєстрації</TableHead>
            <TableHead className="text-right">Дії</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className="opacity-75 bg-muted/20">
              <TableCell className="text-muted-foreground">{u.id}</TableCell>
              <TableCell className="font-medium">{u.last_name}</TableCell>
              <TableCell>{u.first_name}</TableCell>
              <TableCell>{u.phone}</TableCell>
              <TableCell>
                <Badge variant="secondary">{ROLE_LABELS[u.role as UserRoleType] || u.role}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(u.created_at)}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRestoreRequest(u.id)}
                  disabled={restoringUser}
                  title="Відновити користувача"
                  className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Відновити
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
