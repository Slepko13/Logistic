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
import { useGetTripHistory } from '@/api/services/trips/queries';
import { Trip, TripDriver } from '@/api/services/trips/requests';

export default function AdminTripHistoryPage() {
  const { data: trips, isLoading } = useGetTripHistory();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Історія рейсів (Завершені)</h2>
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
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips?.map((trip: Trip) => (
              <TableRow key={trip.id}>
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
                <TableCell>
                  <Badge variant="outline">{trip.status}</Badge>
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
    </div>
  );
}
