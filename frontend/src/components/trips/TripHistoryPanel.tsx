import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { useGetTripAuditHistory } from '../../api/services/trips/queries';
import { Loader2, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Search, Filter, ArrowDownUp } from 'lucide-react';

const ACTION_MAP: Record<string, string> = {
  TRIP_CREATED: 'Створено рейс',
  TRIP_UPDATED: 'Оновлено рейс',
  DRIVER_ADDED: 'Додано водія',
  DRIVER_REMOVED: 'Видалено водія',
  SEAT_UPDATED: 'Оновлено місце',
  PARCEL_ADDED: 'Додано посилку',
  PARCEL_UPDATED: 'Оновлено посилку',
  PARCEL_REMOVED: 'Видалено посилку',
  TRIP_COMPLETED: 'Рейс завершено'
};

const FIELD_MAP: Record<string, string> = {
  departure_city: 'Місто відправлення',
  departure_date: 'Дата відправлення',
  arrival_city: 'Місто прибуття',
  arrival_date: 'Дата прибуття',
  vehicle_id: 'ID Автобуса',
  first_name: 'Ім\'я',
  last_name: 'Прізвище',
  phone: 'Телефон',
  boarding_address: 'Адреса посадки',
  baggage_info: 'Інформація про багаж',
  weight: 'Вага (кг)',
  description: 'Опис посилки',
  delivery_address: 'Адреса доставки',
  is_delivered: 'Статус доставки',
  status: 'Статус',
  user_id: 'ID Водія',
  driver: 'Водій'
};

function getEventColor(action: string) {
  if (action.startsWith('TRIP_')) return 'bg-blue-500';
  if (action.startsWith('PARCEL_')) return 'bg-amber-500';
  if (action.startsWith('SEAT_')) return 'bg-emerald-500';
  if (action.startsWith('DRIVER_')) return 'bg-purple-500';
  return 'bg-primary';
}

function DiffViewer({ changes }: { changes: any }) {
  if (!changes) return null;

  const { before, after } = changes;
  const keys = new Set<string>();
  if (before) Object.keys(before).forEach((k) => keys.add(k));
  if (after) Object.keys(after).forEach((k) => keys.add(k));

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground text-xs uppercase">
          <tr>
            <th className="px-4 py-2 border-b">Поле</th>
            {before && <th className="px-4 py-2 border-b text-red-600/80">Було</th>}
            {after && <th className="px-4 py-2 border-b text-green-600/80">Стало</th>}
          </tr>
        </thead>
        <tbody>
          {Array.from(keys).map((key) => {
            const valBefore = before ? before[key] : undefined;
            const valAfter = after ? after[key] : undefined;

            if (valBefore === valAfter) return null;

            const formatVal = (v: any) => {
              if (v === null || v === undefined) return '-';
              if (typeof v === 'boolean') return v ? 'Так' : 'Ні';
              if (typeof v === 'object') return JSON.stringify(v);
              if (typeof v === 'string' && /^\\d{4}-\\d{2}-\\d{2}T/.test(v)) {
                try {
                  return format(new Date(v), 'dd.MM.yyyy', { locale: uk });
                } catch (e) {
                  return v;
                }
              }
              return String(v);
            };

            const fBefore = formatVal(valBefore);
            const fAfter = formatVal(valAfter);

            if (fBefore === fAfter) return null;

            return (
              <tr key={key} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-2 font-medium">{FIELD_MAP[key] || key}</td>
                {before && <td className="px-4 py-2 text-red-600/80 break-all">{fBefore}</td>}
                {after && <td className="px-4 py-2 text-green-600/80 break-all">{fAfter}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface TripHistoryPanelProps {
  tripId: number;
}

export function TripHistoryPanel({ tripId }: TripHistoryPanelProps) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [filterAction, setFilterAction] = React.useState<string>('all');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Скидаємо сторінку на першу при зміні фільтрів
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterAction, sortOrder, limit]);

  const { data: paginatedData, isLoading, error } = useGetTripAuditHistory(tripId, {
    page,
    limit,
    search: debouncedSearch || undefined,
    filterAction: filterAction !== 'all' ? filterAction : undefined,
    sortOrder,
  });

  const [selectedEvent, setSelectedEvent] = React.useState<any | null>(null);

  const history = paginatedData?.data || [];
  const totalPages = paginatedData?.totalPages || 1;
  const total = paginatedData?.total || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-48 text-red-500">
          Помилка завантаження історії
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Історія змін рейсу
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-[200px] h-9"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Фільтр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі події</SelectItem>
                <SelectItem value="trip">Зміни рейсу</SelectItem>
                <SelectItem value="parcel">Посилки</SelectItem>
                <SelectItem value="seat">Пасажири</SelectItem>
                <SelectItem value="driver">Водії</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
              <SelectTrigger className="w-[140px] h-9">
                <ArrowDownUp className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Сортування" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Спершу нові</SelectItem>
                <SelectItem value="asc">Спершу старі</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Activity className="h-12 w-12 mb-4 opacity-20" />
            <p>За вашим запитом нічого не знайдено</p>
          </div>
        ) : (
          <div className="relative border-l border-gray-200 ml-3 space-y-6">
            {history.map((event) => (
              <div 
                key={event.id} 
                className={`relative pl-6 py-2 rounded-md transition-colors ${event.changes ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
                onClick={() => event.changes && setSelectedEvent(event)}
              >
                <div className={`absolute w-3 h-3 ${getEventColor(event.action)} rounded-full -left-1.5 top-3.5 ring-4 ring-white`} />
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{ACTION_MAP[event.action] || event.action}</h4>
                  <time className="text-xs text-gray-500">
                    {format(new Date(event.created_at), 'd MMM yyyy, HH:mm:ss', { locale: uk })}
                  </time>
                </div>
                <div className="text-sm text-gray-700 mt-1">{event.details}</div>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span className="font-medium">Користувач:</span>
                  {event.user ? (
                    <span>
                      {event.user.first_name} {event.user.last_name} ({event.user.role === 'admin' ? 'Адмін' : 'Водій'})
                    </span>
                  ) : (
                    <span>Система</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 0 && (
          <div className="flex items-center justify-between mt-8 border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Відображати по:</span>
              <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Сторінка {page} з {totalPages} (Всього: {total})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Деталі змін: {selectedEvent ? ACTION_MAP[selectedEvent.action] || selectedEvent.action : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && <DiffViewer changes={selectedEvent.changes} />}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
