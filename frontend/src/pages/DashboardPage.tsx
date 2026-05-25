import { useQuery } from '@tanstack/react-query';
import PageLoader from '@/components/common/PageLoader';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as healthApi from '@/api/health';

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    data: health,
    isLoading: loading,
    error: fetchError,
  } = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => healthApi.fetchHealth({ signal }),
  });

  const error = fetchError ? (fetchError as Error).message : null;

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
