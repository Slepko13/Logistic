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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Controller } from 'react-hook-form';
import { isValidPhone, normalizePhone } from '@/lib/validation/auth';
import { CreateUserDto } from '@/api/services/users/requests';

const createUserSchema = z.object({
  last_name: z
    .string()
    .min(3, 'Прізвище має містити мінімум 3 символи')
    .max(50, 'Прізвище не може бути довшим за 50 символів')
    .trim(),
  first_name: z
    .string()
    .min(3, 'Імʼя має містити мінімум 3 символи')
    .max(50, 'Імʼя не може бути довшим за 50 символів')
    .trim(),
  phone: z
    .string()
    .min(1, 'Номер телефону є обовʼязковим')
    .max(20, 'Телефон занадто довгий')
    .refine(isValidPhone, {
      message: 'Невірний формат номера телефону. Приклад: +380501234567',
    }),
  password: z.string().min(6, 'Пароль має містити мінімум 6 символів'),
  role: z.enum(['admin', 'driver']).optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export interface CreateUserDialogProps {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: CreateUserDto) => Promise<void>;
}

export default function CreateUserDialog({
  open,
  loading = false,
  error,
  onOpenChange,
  onSave,
}: CreateUserDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      role: 'driver',
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        role: 'driver',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateUserFormValues) => {
    await onSave({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: normalizePhone(data.phone)!,
      password: data.password.trim(),
      role: data.role as 'admin' | 'driver',
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Додати користувача</AlertDialogTitle>
            <AlertDialogDescription>
              Створіть нового користувача (водія або адміністратора).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-last-name">Прізвище</Label>
              <Input id="create-last-name" {...register('last_name')} />
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-first-name">Імʼя</Label>
              <Input id="create-first-name" {...register('first_name')} />
              {errors.first_name && (
                <p className="text-sm text-destructive">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Номер телефону</Label>
              <Input
                id="create-phone"
                type="tel"
                placeholder="+380501234567"
                {...register('phone')}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Пароль</Label>
              <Input id="create-password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Роль</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="create-role" className="w-full">
                      <SelectValue placeholder="Оберіть роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Водій</SelectItem>
                      <SelectItem value="admin">Адміністратор</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Скасувати</AlertDialogCancel>
            <Button type="submit" disabled={loading}>
              {loading ? 'Збереження...' : 'Створити'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
