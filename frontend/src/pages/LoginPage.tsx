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
import { isValidPhone, normalizePhone } from '@/lib/validation/auth';

const loginSchema = z.object({
  phone: z.string().min(1, 'Номер телефону є обовʼязковим').refine(isValidPhone, {
    message: 'Невірний формат номера телефону. Приклад: +380501234567',
  }),
  password: z.string().min(1, 'Пароль є обовʼязковим'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      await login({
        phone: normalizePhone(data.phone.trim())!,
        password: data.password,
      });
      toast.success('Успішний вхід!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <AuthCard
      title="Вхід"
      subtitle="Увійдіть за номером телефону"
      footerText="Немає акаунту?"
      footerLink="/register"
      footerLabel="Зареєструватися"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Вхід...' : 'Увійти'}
        </Button>
      </form>
    </AuthCard>
  );
}
