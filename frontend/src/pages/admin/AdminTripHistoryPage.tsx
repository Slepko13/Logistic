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
import { Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useState } from 'react';

export default function AdminTripHistoryPage() {
  const { data: trips, isLoading } = useGetTripHistory();
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

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Історія рейсів</h2>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Автобус</TableHead>
              <TableHead>Маршрут</TableHead>
              <TableHead>Дати</TableHead>
              <TableHead>Водії</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips?.map((trip: Trip) => (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDeleteClick(e, trip.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {trips?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Немає завершених рейсів.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
