import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as tripsApi from '@/api/trips';
import { Users, Package, MapPin, Calendar, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES = ['Київ', 'Варшава', 'Львів', 'Краків', 'Берлін'];

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [globalDepDate, setGlobalDepDate] = useState('');
  const [globalArrDate, setGlobalArrDate] = useState('');

  const {
    data: trips,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['active-trips'],
    queryFn: tripsApi.fetchActiveTrips,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        departure_city?: string;
        departure_date?: string;
        arrival_city?: string;
        arrival_date?: string;
      };
    }) => tripsApi.updateTrip(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trips'] });
    },
  });

  const applyGlobalDates = () => {
    if (!trips) return;
    let updated = 0;
    trips.forEach((trip) => {
      const payload: any = {};
      if (globalDepDate) payload.departure_date = new Date(globalDepDate).toISOString();
      if (globalArrDate) payload.arrival_date = new Date(globalArrDate).toISOString();

      if (Object.keys(payload).length > 0) {
        updateMutation.mutate({ id: trip.id, payload });
        updated++;
      }
    });
    if (updated > 0) {
      toast.success(`Оновлено дати для ${updated} рейсів`);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error) return <p className="text-destructive">Помилка завантаження рейсів</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Рейси (Автобуси)</h1>
        <p className="text-muted-foreground">Керуйте активними рейсами та маршрутами.</p>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6 flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-grow min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground">
              Загальна дата відправлення
            </label>
            <input
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={globalDepDate}
              onChange={(e) => setGlobalDepDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 flex-grow min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground">
              Загальна дата прибуття
            </label>
            <input
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={globalArrDate}
              min={globalDepDate || ''}
              onChange={(e) => setGlobalArrDate(e.target.value)}
            />
          </div>
          <Button onClick={applyGlobalDates} disabled={!globalDepDate && !globalArrDate}>
            <Check className="w-4 h-4 mr-2" />
            Застосувати до всіх
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trips?.map((trip) => {
          const occupiedSeats = trip.seats.filter((s) => s.first_name || s.last_name).length;
          const totalSeats = trip.seats.length;
          const parcelsCount = trip.parcels.length;

          return (
            <Card key={trip.id} className="flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{trip.vehicle.name}</CardTitle>
                  <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                    {trip.vehicle.plate_number}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-grow space-y-5">
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold">Звідки</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={trip.departure_city || ''}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: trip.id,
                          payload: { departure_city: e.target.value },
                        })
                      }
                    >
                      <option value="" disabled>
                        Місто
                      </option>
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={trip.departure_date ? trip.departure_date.split('T')[0] : ''}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: trip.id,
                          payload: { departure_date: new Date(e.target.value).toISOString() },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold">Куди</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={trip.arrival_city || ''}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: trip.id,
                          payload: { arrival_city: e.target.value },
                        })
                      }
                    >
                      <option value="" disabled>
                        Місто
                      </option>
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={trip.arrival_date ? trip.arrival_date.split('T')[0] : ''}
                      min={trip.departure_date ? trip.departure_date.split('T')[0] : ''}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: trip.id,
                          payload: { arrival_date: new Date(e.target.value).toISOString() },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>
                      {occupiedSeats} / {totalSeats} місць
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-orange-500" />
                    <span>{parcelsCount} посилок</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button asChild className="w-full">
                  <Link to={`/trips/${trip.id}`}>Відкрити рейс</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
