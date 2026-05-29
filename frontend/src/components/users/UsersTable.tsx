import { Pencil, Shield, Trash2, Car } from 'lucide-react';
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
import { UserListItemDto } from '@/api/services/users/requests';
import { formatDate } from '@/lib/utils';

export interface UsersTableProps {
  users: UserListItemDto[];
  isAdmin: boolean;
  currentUserId?: number;
  onDeleteRequest: (user: UserListItemDto) => void;
  onEditRequest: (user: UserListItemDto) => void;
  onPromoteRequest: (user: UserListItemDto) => void;
  onToggleDriverRequest: (user: UserListItemDto) => void;
  actionError?: string | null;
  togglingDriver?: boolean;
}

export default function UsersTable({
  users,
  isAdmin,
  currentUserId,
  onDeleteRequest,
  onEditRequest,
  onPromoteRequest,
  onToggleDriverRequest,
  actionError,
  togglingDriver,
}: UsersTableProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-lg">Зареєстровані користувачі</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 min-w-0">
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Користувачів ще немає.</p>
        ) : (
          <Table className="[&_td]:whitespace-normal [&_th]:whitespace-normal">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Прізвище</TableHead>
                <TableHead>Імʼя</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Водій</TableHead>
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
                    <TableCell>
                      <Badge
                        variant={u.is_driver ? 'outline' : 'secondary'}
                        className={u.is_driver ? 'border-emerald-500 text-emerald-600' : ''}
                      >
                        {u.is_driver ? 'Так' : 'Ні'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2 min-w-[120px]">
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
                                <Shield className="h-4 w-4 text-amber-500" />
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
                          <Button
                            type="button"
                            variant={u.is_driver ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => onToggleDriverRequest(u)}
                            disabled={togglingDriver}
                            title={u.is_driver ? 'Забрати права водія' : 'Зробити водієм'}
                            aria-label={u.is_driver ? 'Забрати права водія' : 'Зробити водієм'}
                          >
                            {u.is_driver ? (
                              <Car className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Car className="h-4 w-4 text-muted-foreground" />
                            )}
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
