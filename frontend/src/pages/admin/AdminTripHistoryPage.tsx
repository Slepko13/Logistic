import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PageLoader from '@/components/common/PageLoader';
import { useGetTripHistory, useDeleteTripMutation } from '@/api/services/trips/queries';
import { Trip, TripDriver } from '@/api/services/trips/requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search, ArrowUpDown } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminTripHistoryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'desc',
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: tripsData, isLoading } = useGetTripHistory({
    page,
    limit,
    search: debouncedSearchQuery || undefined,
    sortBy: sortConfig?.key,
    sortOrder: sortConfig?.direction,
  });

  const navigate = useNavigate();
  const deleteMutation = useDeleteTripMutation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent row click
    setTripToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!tripToDelete) return;
    deleteMutation.mutate(tripToDelete, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        setTripToDelete(null);
      },
    });
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">Історія рейсів</h2>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[80px] cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  ID <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Автобус</TableHead>
              <TableHead>Маршрут</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('departure_date')}
              >
                <div className="flex items-center gap-1">
                  Дати <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Водії</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tripsData?.data?.map((trip: Trip) => (
              <TableRow
                key={trip.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <TableCell className="font-medium text-muted-foreground">{trip.id}</TableCell>
                <TableCell className="font-medium">
                  {trip.vehicle.name}{' '}
                  <span className="text-xs text-muted-foreground block">
                    {trip.vehicle.plate_number}
                  </span>
                </TableCell>
                <TableCell>
                  {trip.departure_city || '—'} → {trip.arrival_city || '—'}
                </TableCell>
                <TableCell className="text-sm">
                  <div>
                    <span className="text-muted-foreground">Відпр:</span>{' '}
                    {trip.departure_date ? new Date(trip.departure_date).toLocaleDateString() : '—'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Приб:</span>{' '}
                    {trip.arrival_date ? new Date(trip.arrival_date).toLocaleDateString() : '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {trip.drivers.map((d: TripDriver) => (
                      <Badge key={d.user_id} variant="secondary" className="text-xs">
                        {d.user.first_name} {d.user.last_name}
                      </Badge>
                    ))}
                    {trip.drivers.length === 0 && (
                      <span className="text-muted-foreground text-sm">Немає водіїв</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      title="Видалити запис"
                      onClick={(e) => handleDeleteClick(e, trip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tripsData?.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Не знайдено завершених рейсів.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {tripsData && tripsData.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Показувати:</span>
            <Select
              value={limit.toString()}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Попередня
            </Button>
            <span className="text-sm px-2 text-muted-foreground">
              Сторінка {tripsData.page} з {tripsData.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!tripsData.totalPages || page >= tripsData.totalPages}
              onClick={() => setPage((p) => Math.min(tripsData.totalPages, p + 1))}
            >
              Наступна
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Видалити рейс з історії?"
        description="Ви впевнені, що хочете безповоротно видалити цей рейс? Всі пасажири, багаж та історія водіїв для цього рейсу будуть назавжди втрачені."
        onConfirm={handleConfirmDelete}
        confirmLabel="Видалити"
        cancelLabel="Скасувати"
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
