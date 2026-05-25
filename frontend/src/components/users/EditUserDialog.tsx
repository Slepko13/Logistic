import { useEffect, useState, FormEvent } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidPhone, normalizePhone, validateName } from '@/lib/validation/auth';
import { UserListItemDto, UpdateUserDto } from '@/api/users';

function buildInitialForm(user: UserListItemDto | null): UpdateUserDto {
  return {
    last_name: user?.last_name ?? '',
    first_name: user?.first_name ?? '',
    phone: user?.phone ?? '',
  };
}

function preparePayload(form: UpdateUserDto): { errors: string[]; payload: UpdateUserDto | null } {
  const errors: string[] = [];
  const firstNameError = validateName(form.first_name, 'Імʼя');
  const lastNameError = validateName(form.last_name, 'Прізвище');
  const phoneRaw = form.phone?.trim() ?? '';

  if (firstNameError) errors.push(firstNameError);
  if (lastNameError) errors.push(lastNameError);

  if (!phoneRaw) {
    errors.push('Номер телефону є обовʼязковим');
  } else if (!isValidPhone(phoneRaw)) {
    errors.push('Невірний формат номера телефону. Приклад: +380501234567');
  }

  if (errors.length > 0) {
    return { errors, payload: null };
  }

  return {
    errors: [],
    payload: {
      last_name: form.last_name!.trim(),
      first_name: form.first_name!.trim(),
      phone: normalizePhone(phoneRaw)!,
    },
  };
}

export interface EditUserDialogProps {
  open: boolean;
  user: UserListItemDto | null;
  loading?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: UpdateUserDto) => Promise<void>;
}

export default function EditUserDialog({
  open,
  user,
  loading = false,
  error,
  onOpenChange,
  onSave,
}: EditUserDialogProps) {
  const [form, setForm] = useState<UpdateUserDto>(buildInitialForm(user));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(user));
      setLocalError(null);
    }
  }, [open, user]);

  function updateField(field: keyof UpdateUserDto, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const { errors, payload } = preparePayload(form);
    if (errors.length > 0) {
      setLocalError(errors[0]);
      return;
    }

    if (payload) {
      await onSave(payload);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Редагувати користувача</AlertDialogTitle>
            <AlertDialogDescription>
              Змініть контактні дані користувача. Роль у цьому вікні не редагується.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-last-name">Прізвище</Label>
              <Input
                id="edit-last-name"
                value={form.last_name || ''}
                onChange={(e) => updateField('last_name', e.target.value)}
                minLength={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-first-name">Імʼя</Label>
              <Input
                id="edit-first-name"
                value={form.first_name || ''}
                onChange={(e) => updateField('first_name', e.target.value)}
                minLength={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Номер телефону</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={form.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+380501234567"
                required
              />
            </div>
            {(localError || error) && (
              <p className="text-sm text-destructive">{localError || error}</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Скасувати</AlertDialogCancel>
            <Button type="submit" disabled={loading}>
              {loading ? 'Збереження...' : 'Зберегти'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
