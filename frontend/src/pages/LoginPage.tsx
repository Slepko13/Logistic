import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '@/components/auth/AuthCard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/common/PasswordInput';
import { prepareLoginPayload } from '@/lib/validation/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const { errors, payload } = prepareLoginPayload({ phone, password });
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      if (payload) {
        await login(payload);
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
      title="Вхід"
      subtitle="Увійдіть за номером телефону"
      footerText="Немає акаунту?"
      footerLink="/register"
      footerLabel="Зареєструватися"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Номер телефону</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380501234567"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Вхід...' : 'Увійти'}
        </Button>
      </form>
    </AuthCard>
  );
}
