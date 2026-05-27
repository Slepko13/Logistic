import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageLoader from '@/components/common/PageLoader';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  User,
  Edit,
  Users,
  Phone,
  Package,
  Plus,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as tripsApi from '@/api/trips';
import * as usersApi from '@/api/users';

export default function TripDetailPage() {
  const { id } = useParams();
  const tripId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // Seat modal state
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [editingSeatNumber, setEditingSeatNumber] = useState<number | null>(null);
  const [seatForm, setSeatForm] = useState<{
    first_name: string;
    last_name: string;
    phone: string;
    boarding_address: string;
    baggage_info: { name: string; weight: number }[];
  }>({ first_name: '', last_name: '', phone: '', boarding_address: '', baggage_info: [] });

  // Confirm modals state
  const [clearSeatConfirmOpen, setClearSeatConfirmOpen] = useState(false);
  const [seatToClear, setSeatToClear] = useState<number | null>(null);

  const [deleteSeatConfirmOpen, setDeleteSeatConfirmOpen] = useState(false);
  const [seatToDelete, setSeatToDelete] = useState<number | null>(null);

  // Parcel modal state
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  const [editingParcelId, setEditingParcelId] = useState<number | null>(null);
  const [parcelForm, setParcelForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    weight: 0,
    delivery_address: '',
  });

  const [deleteParcelConfirmOpen, setDeleteParcelConfirmOpen] = useState(false);
  const [parcelToDelete, setParcelToDelete] = useState<number | null>(null);

  const [completeTripConfirmOpen, setCompleteTripConfirmOpen] = useState(false);

  const { data: trip, isLoading: isLoadingTrip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.fetchTrip(tripId),
  });

  // Fetch all users (only admin has access, but we try anyway. Error is ignored if not admin)
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.fetchUsers,
    enabled: user?.role === 'admin',
  });

  const addDriverMutation = useMutation({
    mutationFn: (userId: number) => tripsApi.addTripDriver(tripId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      toast.success('Водія додано');
      setSelectedDriverId('');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка додавання водія'),
  });

  const removeDriverMutation = useMutation({
    mutationFn: (userId: number) => tripsApi.removeTripDriver(tripId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      toast.success('Водія видалено');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка видалення водія'),
  });

  const updateSeatMutation = useMutation({
    mutationFn: ({
      seatNumber,
      payload,
    }: {
      seatNumber: number;
      payload: Record<string, unknown>;
    }) => tripsApi.updateTripSeat(tripId, seatNumber, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      toast.success('Місце оновлено');
      setIsSeatModalOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка оновлення місця'),
  });

  const addSeatMutation = useMutation({
    mutationFn: () => tripsApi.addTripSeat(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      toast.success('Місце додано');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка додавання місця'),
  });

  const removeSeatMutation = useMutation({
    mutationFn: (seatNumber: number) => tripsApi.removeTripSeat(tripId, seatNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      toast.success('Місце видалено');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка видалення місця'),
  });

  const handleOpenSeatModal = (seat: tripsApi.TripSeat) => {
    setEditingSeatNumber(seat.seat_number);
    setSeatForm({
      first_name: seat.first_name || '',
      last_name: seat.last_name || '',
      phone: seat.phone || '',
      boarding_address: seat.boarding_address || trip?.departure_city || '',
      baggage_info: Array.isArray(seat.baggage_info)
        ? (seat.baggage_info as { name: string; weight: number }[])
        : [],
    });
    setIsSeatModalOpen(true);
  };

  const handleAddBaggage = () => {
    setSeatForm((prev) => ({
      ...prev,
      baggage_info: [...prev.baggage_info, { name: '', weight: 0 }],
    }));
  };

  const handleRemoveBaggage = (index: number) => {
    setSeatForm((prev) => ({
      ...prev,
      baggage_info: prev.baggage_info.filter((_, i) => i !== index),
    }));
  };

  const handleBaggageChange = (index: number, field: 'name' | 'weight', value: string | number) => {
    setSeatForm((prev) => {
      const newBaggage = [...prev.baggage_info];
      newBaggage[index] = { ...newBaggage[index], [field]: value };
      return { ...prev, baggage_info: newBaggage };
    });
  };

  const handleSaveSeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeatNumber !== null) {
      updateSeatMutation.mutate({
        seatNumber: editingSeatNumber,
        payload: {
          first_name: seatForm.first_name || null,
          last_name: seatForm.last_name || null,
          phone: seatForm.phone || null,
          boarding_address: seatForm.boarding_address || null,
          baggage_info: seatForm.baggage_info.length > 0 ? seatForm.baggage_info : null,
        },
      });
    }
  };

  const handleClearSeatClick = (seatNumber: number) => {
    setSeatToClear(seatNumber);
    setClearSeatConfirmOpen(true);
  };

  const executeClearSeat = async () => {
    if (seatToClear !== null) {
      await updateSeatMutation.mutateAsync({
        seatNumber: seatToClear,
        payload: {
          first_name: null,
          last_name: null,
          phone: null,
          boarding_address: null,
          baggage_info: null,
        },
      });
      setClearSeatConfirmOpen(false);
      setSeatToClear(null);
    }
  };

  const handleDeleteSeatClick = (seatNumber: number) => {
    setSeatToDelete(seatNumber);
    setDeleteSeatConfirmOpen(true);
  };

  const executeDeleteSeat = async () => {
    if (seatToDelete !== null) {
      await removeSeatMutation.mutateAsync(seatToDelete);
      setDeleteSeatConfirmOpen(false);
      setSeatToDelete(null);
    }
  };

  // --- PARCELS LOGIC ---
  const addParcelMutation = useMutation({
    mutationFn: (payload: Parameters<typeof tripsApi.addTripParcel>[1]) =>
      tripsApi.addTripParcel(tripId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      toast.success('Передачу додано');
      setIsParcelModalOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка додавання передачі'),
  });

  const updateParcelMutation = useMutation({
    mutationFn: ({
      parcelId,
      payload,
    }: {
      parcelId: number;
      payload: Partial<tripsApi.TripParcel>;
    }) => tripsApi.updateTripParcel(tripId, parcelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      toast.success('Передачу оновлено');
      setIsParcelModalOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка оновлення передачі'),
  });

  const removeParcelMutation = useMutation({
    mutationFn: (parcelId: number) => tripsApi.removeTripParcel(tripId, parcelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      toast.success('Передачу видалено');
      setDeleteParcelConfirmOpen(false);
      setParcelToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка видалення передачі'),
  });

  const handleOpenParcelModal = (parcel?: tripsApi.TripParcel) => {
    if (parcel) {
      setEditingParcelId(parcel.id);
      setParcelForm({
        first_name: parcel.first_name,
        last_name: parcel.last_name,
        phone: parcel.phone,
        weight: parcel.weight,
        delivery_address: parcel.delivery_address,
      });
    } else {
      setEditingParcelId(null);
      setParcelForm({
        first_name: '',
        last_name: '',
        phone: '',
        weight: 0,
        delivery_address: '',
      });
    }
    setIsParcelModalOpen(true);
  };

  const handleSaveParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingParcelId !== null) {
      updateParcelMutation.mutate({
        parcelId: editingParcelId,
        payload: parcelForm,
      });
    } else {
      addParcelMutation.mutate(parcelForm);
    }
  };

  const handleToggleParcelDelivered = (parcel: tripsApi.TripParcel) => {
    updateParcelMutation.mutate({
      parcelId: parcel.id,
      payload: { is_delivered: !parcel.is_delivered },
    });
  };

  const handleDeleteParcelClick = (parcelId: number) => {
    setParcelToDelete(parcelId);
    setDeleteParcelConfirmOpen(true);
  };

  const completeTripMutation = useMutation({
    mutationFn: () => tripsApi.completeTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trips'] });
      toast.success('Рейс успішно завершено! Створено новий рейс для цього автобуса.');
      navigate('/');
    },
    onError: (e: Error) => toast.error(e.message || 'Помилка завершення рейсу'),
  });

  if (isLoadingTrip) return <PageLoader />;
  if (!trip) return <p className="text-destructive">Рейс не знайдено</p>;

  // Filter available drivers (users with role 'driver' or 'admin' who are not already added)
  const availableDrivers = allUsers?.filter(
    (u) =>
      (u.role === 'driver' || u.role === 'admin') && !trip.drivers.some((d) => d.user_id === u.id),
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Рейс {trip.vehicle.name} <Badge variant="secondary">{trip.vehicle.plate_number}</Badge>
          </h1>
          <p className="text-muted-foreground flex gap-2">
            <span>Звідки: {trip.departure_city || '—'}</span>
            <span>Куди: {trip.arrival_city || '—'}</span>
          </p>
        </div>
      </div>

      {/* DRIVERS SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-indigo-500" /> Водії ({trip.drivers.length})
          </CardTitle>
          <CardDescription>
            Призначені водії на цей рейс. Адміністратор може додавати або видаляти водіїв.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* List of current drivers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trip.drivers.map((driver) => (
              <div
                key={driver.user_id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div>
                  <p className="font-medium">
                    {driver.user.first_name} {driver.user.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{driver.user.phone}</p>
                </div>
                {user?.role === 'admin' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeDriverMutation.mutate(driver.user_id)}
                    disabled={removeDriverMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {trip.drivers.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2">Водіїв не призначено.</p>
            )}
          </div>

          {/* Add driver controls (Admin only) */}
          {user?.role === 'admin' && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <select
                className="flex h-9 w-full sm:max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              >
                <option value="" disabled>
                  Оберіть водія...
                </option>
                {availableDrivers?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.first_name} {d.last_name} ({d.phone})
                  </option>
                ))}
                {availableDrivers?.length === 0 && (
                  <option value="" disabled>
                    Немає вільних водіїв
                  </option>
                )}
              </select>
              <Button
                onClick={() => {
                  if (selectedDriverId) addDriverMutation.mutate(Number(selectedDriverId));
                }}
                disabled={!selectedDriverId || addDriverMutation.isPending}
              >
                <UserPlus className="w-4 h-4 mr-2 text-indigo-400" />
                Додати
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEATS SECTION */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-green-500" /> Місця для пасажирів
            </CardTitle>
            <CardDescription>Бронювання місць, багаж та інформація про пасажирів.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSeatMutation.mutate()}
            disabled={addSeatMutation.isPending}
          >
            Додати місце
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trip.seats.map((seat) => {
              const isOccupied = seat.first_name || seat.last_name;

              return (
                <div
                  key={seat.id}
                  className="flex flex-col p-4 border rounded-lg bg-card relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={isOccupied ? 'default' : 'outline'} className="text-sm">
                      Місце {seat.seat_number}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      onClick={() => handleDeleteSeatClick(seat.seat_number)}
                      title="Видалити місце повністю"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {isOccupied ? (
                    <div className="flex-grow space-y-1 mt-1">
                      <p className="font-medium text-lg">
                        {seat.first_name} {seat.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-500" />{' '}
                        {seat.phone || 'Немає телефону'}
                      </p>
                      {seat.boarding_address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-rose-500" />{' '}
                          <span className="truncate" title={seat.boarding_address}>
                            {seat.boarding_address}
                          </span>
                        </p>
                      )}
                      {Array.isArray(seat.baggage_info) && seat.baggage_info.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p className="font-medium text-xs uppercase tracking-wider mb-1">
                            Багаж:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {seat.baggage_info.map((bagItem: unknown, idx: number) => {
                              const b = bagItem as Record<string, unknown>;
                              return (
                                <li key={idx}>
                                  {(b.name as string) || 'Сумка'} —{' '}
                                  {b.weight ? `${b.weight} кг` : 'вага не вказана'}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center py-4">
                      <p className="text-sm text-muted-foreground italic">Вільне місце</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant={isOccupied ? 'outline' : 'default'}
                      className="flex-1"
                      onClick={() => handleOpenSeatModal(seat)}
                    >
                      {isOccupied ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" /> Редагувати
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2 text-indigo-400" /> Забронювати
                        </>
                      )}
                    </Button>
                    {isOccupied && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleClearSeatClick(seat.seat_number)}
                        disabled={updateSeatMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SEAT MODAL */}
      <Dialog open={isSeatModalOpen} onOpenChange={setIsSeatModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveSeat}>
            <DialogHeader>
              <DialogTitle>Редагування місця {editingSeatNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="first_name">Ім&apos;я</Label>
                <Input
                  id="first_name"
                  value={seatForm.first_name}
                  onChange={(e) => setSeatForm({ ...seatForm, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Прізвище</Label>
                <Input
                  id="last_name"
                  value={seatForm.last_name}
                  onChange={(e) => setSeatForm({ ...seatForm, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={seatForm.phone}
                  onChange={(e) => setSeatForm({ ...seatForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boarding_address">Адреса посадки</Label>
                <textarea
                  id="boarding_address"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={seatForm.boarding_address}
                  onChange={(e) => setSeatForm({ ...seatForm, boarding_address: e.target.value })}
                  placeholder="Введіть адресу посадки"
                />
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Багаж</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddBaggage}>
                    + Додати сумку
                  </Button>
                </div>

                {seatForm.baggage_info.map((bag, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 bg-muted/30 p-2 rounded-md border"
                  >
                    <div className="flex-grow space-y-2">
                      <Input
                        placeholder="Опис (напр. Велика чорна валіза)"
                        value={bag.name}
                        onChange={(e) => handleBaggageChange(index, 'name', e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Вага (кг)"
                        value={bag.weight || ''}
                        onChange={(e) =>
                          handleBaggageChange(index, 'weight', Number(e.target.value))
                        }
                        className="h-8 text-sm"
                        min={0}
                        step={1}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveBaggage(index)}
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {seatForm.baggage_info.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Без багажу</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSeatModalOpen(false)}>
                Скасувати
              </Button>
              <Button type="submit" disabled={updateSeatMutation.isPending}>
                Зберегти
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PARCELS SECTION */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-orange-500" /> Передачі
            </CardTitle>
            <CardDescription>Управління доставкою передач, адреси та статуси.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleOpenParcelModal()}>
            <Plus className="w-4 h-4 mr-2 text-emerald-400" />
            Додати передачу
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">№</TableHead>
                  <TableHead>Відправник / Отримувач</TableHead>
                  <TableHead>Контакти</TableHead>
                  <TableHead>Адреса доставки</TableHead>
                  <TableHead className="text-center">Вага (кг)</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trip.parcels.map((parcel) => (
                  <TableRow
                    key={parcel.id}
                    className={
                      parcel.is_delivered
                        ? 'opacity-50 bg-muted/50 transition-opacity'
                        : 'transition-opacity'
                    }
                  >
                    <TableCell className="font-medium text-center">
                      {parcel.parcel_number}
                    </TableCell>
                    <TableCell>
                      {parcel.first_name} {parcel.last_name}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Phone className="w-3 h-3 text-emerald-500" /> {parcel.phone}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={parcel.delivery_address}>
                      {parcel.delivery_address}
                    </TableCell>
                    <TableCell className="text-center">{parcel.weight}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          checked={parcel.is_delivered}
                          onChange={() => handleToggleParcelDelivered(parcel)}
                          title="Відмітити як доставлено"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenParcelModal(parcel)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteParcelClick(parcel.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {trip.parcels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Немає жодної передачі для цього рейсу.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PARCEL MODAL */}
      <Dialog open={isParcelModalOpen} onOpenChange={setIsParcelModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveParcel}>
            <DialogHeader>
              <DialogTitle>
                {editingParcelId ? 'Редагування передачі' : 'Нова передача'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p_first_name">Ім&apos;я</Label>
                  <Input
                    id="p_first_name"
                    value={parcelForm.first_name}
                    onChange={(e) => setParcelForm({ ...parcelForm, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_last_name">Прізвище</Label>
                  <Input
                    id="p_last_name"
                    value={parcelForm.last_name}
                    onChange={(e) => setParcelForm({ ...parcelForm, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p_phone">Телефон</Label>
                  <Input
                    id="p_phone"
                    value={parcelForm.phone}
                    onChange={(e) => setParcelForm({ ...parcelForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p_weight">Вага (кг)</Label>
                  <Input
                    id="p_weight"
                    type="number"
                    min={1}
                    step={1}
                    value={parcelForm.weight || ''}
                    onChange={(e) =>
                      setParcelForm({ ...parcelForm, weight: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p_address">Адреса доставки</Label>
                <Input
                  id="p_address"
                  value={parcelForm.delivery_address}
                  onChange={(e) =>
                    setParcelForm({ ...parcelForm, delivery_address: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsParcelModalOpen(false)}>
                Скасувати
              </Button>
              <Button
                type="submit"
                disabled={addParcelMutation.isPending || updateParcelMutation.isPending}
              >
                Зберегти
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* COMPLETE TRIP */}
      <div className="flex justify-end pt-4">
        <Button
          variant="destructive"
          onClick={() => setCompleteTripConfirmOpen(true)}
          disabled={completeTripMutation.isPending}
        >
          Завершити рейс
        </Button>
      </div>

      <ConfirmDialog
        open={clearSeatConfirmOpen}
        onOpenChange={setClearSeatConfirmOpen}
        title="Звільнити місце?"
        description="Ви дійсно хочете звільнити це місце? Всі дані пасажира (включаючи багаж) будуть видалені."
        confirmLabel="Звільнити"
        confirmVariant="destructive"
        onConfirm={executeClearSeat}
        loading={updateSeatMutation.isPending}
      />

      <ConfirmDialog
        open={deleteSeatConfirmOpen}
        onOpenChange={setDeleteSeatConfirmOpen}
        title="Видалити місце повністю?"
        description="Ви дійсно хочете видалити це місце з рейсу? Ця дія незворотня."
        confirmLabel="Видалити"
        confirmVariant="destructive"
        onConfirm={executeDeleteSeat}
        loading={removeSeatMutation.isPending}
      />
      <ConfirmDialog
        open={deleteParcelConfirmOpen}
        onOpenChange={setDeleteParcelConfirmOpen}
        title="Видалити передачу?"
        description="Ви дійсно хочете повністю видалити цю передачу з рейсу? Вона зникне назавжди."
        confirmLabel="Видалити"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (parcelToDelete !== null) {
            await removeParcelMutation.mutateAsync(parcelToDelete);
          }
        }}
        loading={removeParcelMutation.isPending}
      />

      <ConfirmDialog
        open={completeTripConfirmOpen}
        onOpenChange={setCompleteTripConfirmOpen}
        title="Завершити рейс?"
        description="Ви дійсно хочете завершити цей рейс? Поточний рейс буде переведено в архів, а для цього автобуса буде створено новий пустий рейс з 7 місцями."
        confirmLabel="Завершити рейс"
        confirmVariant="default"
        onConfirm={async () => {
          await completeTripMutation.mutateAsync();
        }}
        loading={completeTripMutation.isPending}
      />
    </div>
  );
}
