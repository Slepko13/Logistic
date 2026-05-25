import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import AuthCard from '@/components/auth/AuthCard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/common/PasswordInput';
import { countLetters, isValidPhone, normalizePhone } from '@/lib/validation/auth';

const registerSchema = z
  .object({
    last_name: z
      .string()
      .min(1, 'Прізвище є обовʼязковим')
      .max(50, 'Прізвище не може бути довшим за 50 символів')
      .refine((val) => countLetters(val) >= 3, 'Прізвище має містити щонайменше 3 літери')
      .transform((val) => val.trim()),
    first_name: z
      .string()
      .min(1, 'Імʼя є обовʼязковим')
      .max(50, 'Імʼя не може бути довшим за 50 символів')
      .refine((val) => countLetters(val) >= 3, 'Імʼя має містити щонайменше 3 літери')
      .transform((val) => val.trim()),
    phone: z
      .string()
      .min(1, 'Номер телефону є обовʼязковим')
      .max(20, 'Телефон занадто довгий')
      .refine(isValidPhone, {
        message: 'Невірний формат номера телефону. Приклад: +380501234567',
      }),
    password: z
      .string()
      .min(6, 'Пароль має містити щонайменше 6 символів')
      .max(100, 'Пароль занадто довгий'),
    confirmPassword: z
      .string()
      .min(6, 'Пароль має містити щонайменше 6 символів')
      .max(100, 'Пароль занадто довгий'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролі не збігаються',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      last_name: '',
      first_name: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    try {
      await authRegister({
        phone: normalizePhone(data.phone.trim())!,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
      });
      toast.success('Успішна реєстрація!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <AuthCard
      title="Реєстрація"
      subtitle="Імʼя, прізвище, телефон та пароль — обовʼязкові"
      footerText="Вже є акаунт?"
      footerLink="/login"
      footerLabel="Увійти"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="last_name">Прізвище</Label>
          <Input id="last_name" {...register('last_name')} />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_name">Імʼя</Label>
          <Input id="first_name" {...register('first_name')} />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Номер телефону</Label>
          <Input id="phone" type="tel" placeholder="+380501234567" {...register('phone')} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <PasswordInput
            id="password"
            value={watch('password')}
            onChange={(e) => setValue('password', e.target.value, { shouldValidate: true })}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Підтвердження пароля</Label>
          <PasswordInput
            id="confirmPassword"
            value={watch('confirmPassword')}
            onChange={(e) => setValue('confirmPassword', e.target.value, { shouldValidate: true })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Реєстрація...' : 'Зареєструватися'}
        </Button>
      </form>
    </AuthCard>
  );
}
