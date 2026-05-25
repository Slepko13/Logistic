import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '@/components/auth/AuthCard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/common/PasswordInput';
import { prepareRegisterPayload, RegisterFormState } from '@/lib/validation/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterFormState>({
    phone: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof RegisterFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const { errors, payload } = prepareRegisterPayload(form);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      if (payload) {
        await register(payload);
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Реєстрація"
      subtitle="Імʼя, прізвище, телефон та пароль — обовʼязкові"
      footerText="Вже є акаунт?"
      footerLink="/login"
      footerLabel="Увійти"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="last_name">Прізвище</Label>
          <Input
            id="last_name"
            value={form.last_name || ''}
            onChange={(e) => updateField('last_name', e.target.value)}
            minLength={3}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_name">Імʼя</Label>
          <Input
            id="first_name"
            value={form.first_name || ''}
            onChange={(e) => updateField('first_name', e.target.value)}
            minLength={3}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Номер телефону</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+380501234567"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <PasswordInput
            id="password"
            value={form.password || ''}
            onChange={(e) => updateField('password', e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Підтвердження пароля</Label>
          <PasswordInput
            id="confirmPassword"
            value={form.confirmPassword || ''}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Реєстрація...' : 'Зареєструватися'}
        </Button>
      </form>
    </AuthCard>
  );
}
