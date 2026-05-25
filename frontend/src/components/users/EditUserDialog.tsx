import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { isValidPhone, normalizePhone } from '@/lib/validation/auth';
import { UserListItemDto, UpdateUserDto } from '@/api/users';

const editUserSchema = z.object({
  last_name: z.string().min(3, 'Прізвище має містити мінімум 3 символи').trim(),
  first_name: z.string().min(3, 'Імʼя має містити мінімум 3 символи').trim(),
  phone: z.string().min(1, 'Номер телефону є обовʼязковим').refine(isValidPhone, {
    message: 'Невірний формат номера телефону. Приклад: +380501234567',
  }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (open && user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      });
    } else if (!open) {
      reset({
        first_name: '',
        last_name: '',
        phone: '',
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data: EditUserFormValues) => {
    await onSave({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: normalizePhone(data.phone)!,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Редагувати користувача</AlertDialogTitle>
            <AlertDialogDescription>
              Змініть контактні дані користувача. Роль у цьому вікні не редагується.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-last-name">Прізвище</Label>
              <Input id="edit-last-name" {...register('last_name')} />
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-first-name">Імʼя</Label>
              <Input id="edit-first-name" {...register('first_name')} />
              {errors.first_name && (
                <p className="text-sm text-destructive">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Номер телефону</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+380501234567"
                {...register('phone')}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
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
