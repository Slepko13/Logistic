import { useEffect, useState } from 'react';
import PageLoader from '@/components/common/PageLoader';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAbortError } from '@/api/client';
import * as healthApi from '@/api/health';

export default function DashboardPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<healthApi.HealthResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const healthData = await healthApi.fetchHealth({
          signal: controller.signal,
        });
        setHealth(healthData);
      } catch (err: unknown) {
        if (!isAbortError(err)) {
          setError(err instanceof Error ? err.message : 'Error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <p className="text-destructive">Помилка: {error}</p>;
  }

  return (
    <div className="space-y-6">
      {health && (
        <Badge variant={health.status === 'ok' ? 'default' : 'destructive'} className="text-sm">
          API: {health.status} · DB: {health.database}
        </Badge>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Вітаємо, {user?.first_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Робоча панель готова до підключення розділу бусів і місць.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
