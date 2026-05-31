import { useState } from 'react';

import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageLoader from '@/components/common/PageLoader';
import {
  useGetTrips,
  useUpdateTripMutation,
  useCreateTripMutation,
  useDeleteTripMutation,
} from '@/api/services/trips/queries';
import { Trip, UpdateTripPayload } from '@/api/services/trips/requests';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useGetVehicles } from '@/api/services/vehicles/queries';
import { useGetUsers } from '@/api/services/users/queries';
import { useGetCities } from '@/api/services/cities/queries';

export default function AdminTripsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);
  const [selectedDriverToAdd, setSelectedDriverToAdd] = useState<string>('');
  const [addVehicleId, setAddVehicleId] = useState<string>('');

  const [form, setForm] = useState<{
    vehicle_id: string;
    departure_city: string;
    departure_date: string;
    arrival_city: string;
    arrival_date: string;
    driverIds: number[];
  }>({
    vehicle_id: '',
    departure_city: '',
    departure_date: '',
    arrival_city: '',
    arrival_date: '',
    driverIds: [],
  });

  const { data: trips, isLoading: isLoadingTrips } = useGetTrips();
  const { data: vehicles } = useGetVehicles();
  const { data: users } = useGetUsers();
  const { data: cities } = useGetCities();

  const driversList = users?.filter((u) => u.role === 'driver' || u.role === 'admin') || [];

  const _updateMutation = useUpdateTripMutation();
  const updateMutation = {
    ..._updateMutation,
    mutate: (vars: { id: number; payload: UpdateTripPayload }) => {
      _updateMutation.mutate(vars, {
        onSuccess: () => {
          toast.success('Рейс оновлено');
          setIsModalOpen(false);
        },
        onError: (e: Error) => toast.error(e.message || 'Помилка оновлення рейсу'),
      });
    },
  };

  const createMutation = useCreateTripMutation();
  const deleteMutation = useDeleteTripMutation();

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVehicleId) return;
    createMutation.mutate(parseInt(addVehicleId), {
      onSuccess: () => {
        setIsAddModalOpen(false);
        setAddVehicleId('');
      },
    });
  };

  const handleDeleteClick = (id: number) => {
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

  const handleOpenModal = (trip: Trip) => {
    setEditingTripId(trip.id);
    setForm({
      vehicle_id: trip.vehicle_id.toString(),
      departure_city: trip.departure_city || '',
      departure_date: trip.departure_date
        ? new Date(trip.departure_date).toISOString().slice(0, 16)
        : '',
      arrival_city: trip.arrival_city || '',
      arrival_date: trip.arrival_date ? new Date(trip.arrival_date).toISOString().slice(0, 16) : '',
      driverIds: trip.drivers.map((d) => d.user_id),
    });
    setIsModalOpen(true);
  };

  const handleRemoveDriver = (driverId: number) => {
    setForm((prev) => ({
      ...prev,
      driverIds: prev.driverIds.filter((id) => id !== driverId),
    }));
  };

  const handleAddDriver = () => {
    if (!selectedDriverToAdd) return;
    const driverId = parseInt(selectedDriverToAdd);
    setForm((prev) => {
      if (prev.driverIds.includes(driverId)) return prev;
      return { ...prev, driverIds: [...prev.driverIds, driverId] };
    });
    setSelectedDriverToAdd('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTripId) return;
    const tripVersion = trips?.find((t) => t.id === editingTripId)?.version;

    const payload: UpdateTripPayload = {
      vehicle_id: parseInt(form.vehicle_id),
      departure_city: form.departure_city || null,
      arrival_city: form.arrival_city || null,
      departure_date: form.departure_date ? new Date(form.departure_date).toISOString() : null,
      arrival_date: form.arrival_date ? new Date(form.arrival_date).toISOString() : null,
      driverIds: form.driverIds,
      version: tripVersion,
    };

    updateMutation.mutate({ id: editingTripId, payload });
  };

  if (isLoadingTrips) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Управління рейсами</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>Створити рейс</Button>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0 px-4 sm:px-6 overflow-x-auto">
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
              {trips?.map((trip) => (
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
                      {trip.departure_date
                        ? new Date(trip.departure_date).toLocaleDateString()
                        : '—'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Приб:</span>{' '}
                      {trip.arrival_date ? new Date(trip.arrival_date).toLocaleDateString() : '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {trip.drivers.map((d) => (
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
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(trip)}
                        title="Редагувати рейс"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        title="Видалити рейс"
                        onClick={() => handleDeleteClick(trip.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {trips?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Рейсів не знайдено
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>Редагування рейсу #{editingTripId}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="t_vehicle">Транспортний засіб (Автобус)</Label>
                <Select
                  value={form.vehicle_id || undefined}
                  onValueChange={(value) => setForm({ ...form, vehicle_id: value })}
                  required
                >
                  <SelectTrigger id="t_vehicle" className="w-full">
                    <SelectValue placeholder="Оберіть автобус" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.name} {v.plate_number ? `(${v.plate_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="t_dep_city">Місто відправлення</Label>
                  <Select
                    value={form.departure_city || 'none'}
                    onValueChange={(value) =>
                      setForm({ ...form, departure_city: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger id="t_dep_city" className="w-full">
                      <SelectValue placeholder="Оберіть місто" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Оберіть місто</SelectItem>
                      {cities?.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t_arr_city">Місто прибуття</Label>
                  <Select
                    value={form.arrival_city || 'none'}
                    onValueChange={(value) =>
                      setForm({ ...form, arrival_city: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger id="t_arr_city" className="w-full">
                      <SelectValue placeholder="Оберіть місто" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Оберіть місто</SelectItem>
                      {cities?.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="t_dep_date">Дата відправлення</Label>
                  <Input
                    id="t_dep_date"
                    type="date"
                    value={form.departure_date ? form.departure_date.slice(0, 10) : ''}
                    onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t_arr_date">Дата прибуття</Label>
                  <Input
                    id="t_arr_date"
                    type="date"
                    min={form.departure_date ? form.departure_date.slice(0, 10) : ''}
                    value={form.arrival_date ? form.arrival_date.slice(0, 10) : ''}
                    onChange={(e) => setForm({ ...form, arrival_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Водії на рейс</Label>

                <div className="space-y-2 mb-4">
                  {form.driverIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Немає призначених водіїв</p>
                  ) : (
                    form.driverIds.map((driverId) => {
                      const driver = driversList.find((d) => d.id === driverId);
                      if (!driver) return null;
                      return (
                        <div
                          key={driverId}
                          className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                        >
                          <span className="text-sm">
                            {driver.first_name} {driver.last_name} ({driver.phone})
                          </span>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            title="Видалити водія"
                            onClick={() => handleRemoveDriver(driverId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <Select
                    value={selectedDriverToAdd || undefined}
                    onValueChange={(value) => setSelectedDriverToAdd(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Оберіть водія для додавання..." />
                    </SelectTrigger>
                    <SelectContent>
                      {driversList
                        .filter((d) => !form.driverIds.includes(d.id))
                        .map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.first_name} {driver.last_name} ({driver.phone})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddDriver}
                    disabled={!selectedDriverToAdd}
                  >
                    Додати
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Скасувати
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Зберегти
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Створити рейс</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Оберіть автобус</Label>
              <Select value={addVehicleId} onValueChange={setAddVehicleId} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Оберіть автобус --" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.name} ({vehicle.plate_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Скасувати
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !addVehicleId}>
                Створити
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Видалити рейс?"
        description="Ви впевнені, що хочете видалити цей рейс? Всі пасажири, багаж, передачі та призначення водіїв будуть безповоротно видалені."
        onConfirm={handleConfirmDelete}
        confirmLabel="Видалити"
        cancelLabel="Скасувати"
        confirmVariant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
