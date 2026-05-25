import { Pencil, Shield, Trash2 } from 'lucide-react';
import { ROLE_LABELS, UserRole, UserRoleType } from '@/constants/userRole';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserListItemDto } from '@/api/users';
import { formatDate } from '@/lib/utils';

export interface UsersTableProps {
  users: UserListItemDto[];
  isAdmin: boolean;
  currentUserId?: number;
  onDeleteRequest: (user: UserListItemDto) => void;
  onEditRequest: (user: UserListItemDto) => void;
  onPromoteRequest: (user: UserListItemDto) => void;
  actionError?: string | null;
}

export default function UsersTable({
  users,
  isAdmin,
  currentUserId,
  onDeleteRequest,
  onEditRequest,
  onPromoteRequest,
  actionError,
}: UsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Зареєстровані користувачі</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Користувачів ще немає.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Прізвище</TableHead>
                <TableHead>Імʼя</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Дата реєстрації</TableHead>
                {isAdmin && <TableHead className="text-right">Дії</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isTargetAdmin = u.role === UserRole.ADMIN;
                const isSelf = u.id === currentUserId;

                return (
                  <TableRow key={u.id}>
                    <TableCell className="text-muted-foreground">{u.id}</TableCell>
                    <TableCell className="font-medium">{u.last_name}</TableCell>
                    <TableCell>{u.first_name}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>
                      <Badge variant={isTargetAdmin ? 'default' : 'secondary'}>
                        {ROLE_LABELS[u.role as UserRoleType] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!isTargetAdmin && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onPromoteRequest(u)}
                                title="Зробити адміністратором"
                                aria-label="Зробити адміністратором"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onEditRequest(u)}
                            title="Редагувати користувача"
                            aria-label="Редагувати користувача"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!isTargetAdmin && (
                            <>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => onDeleteRequest(u)}
                                disabled={isSelf}
                                title={
                                  isSelf
                                    ? 'Не можна видалити власний акаунт'
                                    : 'Видалити користувача'
                                }
                                aria-label={
                                  isSelf
                                    ? 'Не можна видалити власний акаунт'
                                    : 'Видалити користувача'
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
