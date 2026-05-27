import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as tripsApi from '@/api/trips';
import * as citiesApi from '@/api/cities';
import { Users, Package, MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [globalDepDate, setGlobalDepDate] = useState('');
  const [globalArrDate, setGlobalArrDate] = useState('');
  const [globalDepCity, setGlobalDepCity] = useState('');
  const [globalArrCity, setGlobalArrCity] = useState('');

  const {
    data: trips,
    isLoading: tripsLoading,
    error,
  } = useQuery({
    queryKey: ['active-trips'],
    queryFn: tripsApi.fetchActiveTrips,
  });

  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: citiesApi.fetchCities,
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

  const applyGlobalSettings = async () => {
    if (!trips) return;

    const promises: Promise<unknown>[] = [];
    trips.forEach((trip) => {
      const payload: Record<string, unknown> = {};
      if (globalDepDate) payload.departure_date = new Date(globalDepDate).toISOString();
      if (globalArrDate) payload.arrival_date = new Date(globalArrDate).toISOString();
      if (globalDepCity) payload.departure_city = globalDepCity;
      if (globalArrCity) payload.arrival_city = globalArrCity;

      if (Object.keys(payload).length > 0) {
        promises.push(updateMutation.mutateAsync({ id: trip.id, payload }));
      }
    });

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
        toast.success(`Оновлено дані для ${promises.length} рейсів`);
      } catch {
        toast.error('Помилка при оновленні деяких рейсів');
      }
    }
  };

  if (tripsLoading || citiesLoading) return <PageLoader />;
  if (error) return <p className="text-destructive">Помилка завантаження рейсів</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Рейси (Автобуси)</h1>
        <p className="text-muted-foreground">Керуйте активними рейсами та маршрутами.</p>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6 flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-grow min-w-[150px]">
            <label className="text-sm font-medium text-muted-foreground">
              Загальне місто відправлення
            </label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={globalDepCity}
              onChange={(e) => setGlobalDepCity(e.target.value)}
            >
              <option value="">Не змінювати</option>
              {cities?.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 flex-grow min-w-[150px]">
            <label className="text-sm font-medium text-muted-foreground">
              Загальне місто прибуття
            </label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={globalArrCity}
              onChange={(e) => setGlobalArrCity(e.target.value)}
            >
              <option value="">Не змінювати</option>
              {cities?.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 flex-grow min-w-[150px]">
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
          <div className="space-y-2 flex-grow min-w-[150px]">
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
          <Button
            className="w-full sm:w-auto mt-2 sm:mt-0"
            onClick={applyGlobalSettings}
            disabled={!globalDepDate && !globalArrDate && !globalDepCity && !globalArrCity}
          >
            <Check className="w-4 h-4 mr-2 text-emerald-400" />
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
                      {cities?.map((city) => (
                        <option key={city.id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={
                        trip.departure_date
                          ? new Date(trip.departure_date).toISOString().slice(0, 16)
                          : ''
                      }
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
                      {cities?.map((city) => (
                        <option key={city.id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={
                        trip.arrival_date
                          ? new Date(trip.arrival_date).toISOString().slice(0, 16)
                          : ''
                      }
                      min={
                        trip.departure_date
                          ? new Date(trip.departure_date).toISOString().slice(0, 16)
                          : ''
                      }
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
                <div
                  className="w-full"
                  title={
                    !trip.departure_city ||
                    !trip.arrival_city ||
                    !trip.departure_date ||
                    !trip.arrival_date
                      ? 'Заповніть міста та дати відправлення і прибуття, щоб відкрити рейс'
                      : undefined
                  }
                >
                  <Button
                    className="w-full"
                    disabled={
                      !trip.departure_city ||
                      !trip.arrival_city ||
                      !trip.departure_date ||
                      !trip.arrival_date
                    }
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  >
                    Відкрити рейс
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
