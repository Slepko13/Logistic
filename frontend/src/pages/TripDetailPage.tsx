import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Pencil,
  Users,
  Phone,
  Package,
  Plus,
  MapPin,
  Search,
  ArrowUpDown,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { TripHistoryPanel } from '@/components/trips/TripHistoryPanel';
import { EntityHistoryModal } from '@/components/trips/EntityHistoryModal';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { useTripDetail } from '@/hooks/useTripDetail';

export default function TripDetailPage() {
  const { id } = useParams();
  const tripId = Number(id);
  const navigate = useNavigate();

  const {
    currentUser: user,
    trip,
    isLoadingTrip,
    isClosed,

    // Drivers
    selectedDriverId,
    setSelectedDriverId,
    availableDrivers,
    addDriver,
    removeDriver,

    // Seats
    isSeatModalOpen,
    setIsSeatModalOpen,
    editingSeatNumber,
    seatForm,
    setSeatForm,
    handleOpenSeatModal,
    handleAddBaggage,
    handleRemoveBaggage,
    handleBaggageChange,
    handleSaveSeat,
    addSeat,

    // Clear Seat Confirmation
    clearSeatConfirmOpen,
    setClearSeatConfirmOpen,
    handleClearSeatClick,
    executeClearSeat,

    // Delete Seat Confirmation
    deleteSeatConfirmOpen,
    setDeleteSeatConfirmOpen,
    handleDeleteSeatClick,
    executeDeleteSeat,

    // Parcels
    parcelsData,
    parcels: filteredAndSortedParcels,
    isLoadingParcels,
    isParcelModalOpen,
    setIsParcelModalOpen,
    editingParcelId,
    parcelForm,
    setParcelForm,
    handleOpenParcelModal,
    handleSaveParcel,
    handleToggleParcelDelivered,
    handleDeleteParcelClick,
    deleteParcelConfirmOpen,
    setDeleteParcelConfirmOpen,
    executeDeleteParcel,

    // Parcel Search & Pagination
    parcelSearchQuery,
    setParcelSearchQuery,
    parcelStatusFilter,
    setParcelStatusFilter,
    handleParcelSort,
    parcelPage,
    setParcelPage,
    parcelLimit,
    setParcelLimit,

    // Trip Completion
    completeTripConfirmOpen,
    setCompleteTripConfirmOpen,

    // Entity History Modals
    isEntityHistoryOpen,
    setIsEntityHistoryOpen,
    entityHistorySearchQuery,
    setEntityHistorySearchQuery,
    entityHistoryName,
    setEntityHistoryName,

    // Loading/State flags
    addingDriver,
    removingDriver,
    addingSeat,
    savingSeat,
    clearingSeat,
    deletingSeat,
    savingParcel,
    deletingParcel,
    completingTrip,

    // Operations
    executeCompleteTrip,
  } = useTripDetail(tripId);

  if (isLoadingTrip) return <PageLoader />;
  if (!trip) return <p className="text-destructive">Рейс не знайдено</p>;
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 text-slate-500" />
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
      <CollapsibleCard
        title={`Водії (${trip.drivers.length})`}
        icon={<User className="w-5 h-5 text-indigo-500" />}
        description="Призначені водії на цей рейс. Адміністратор може додавати або видаляти водіїв."
      >
        <div className="space-y-4">
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
                {user?.role === 'admin' && !isClosed && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    title="Видалити водія"
                    onClick={() => removeDriver(driver.user_id)}
                    disabled={removingDriver}
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
          {user?.role === 'admin' && !isClosed && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <Select
                value={selectedDriverId || undefined}
                onValueChange={(value) => setSelectedDriverId(value)}
              >
                <SelectTrigger className="w-full sm:max-w-xs h-9">
                  <SelectValue
                    placeholder={
                      availableDrivers?.length === 0 ? 'Немає вільних водіїв' : 'Оберіть водія...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.first_name} {d.last_name} ({d.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (selectedDriverId) addDriver(Number(selectedDriverId));
                }}
                disabled={!selectedDriverId || addingDriver}
              >
                <UserPlus className="w-4 h-4 mr-2 text-indigo-400" />
                Додати
              </Button>
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* SEATS SECTION */}
      <CollapsibleCard
        title="Місця для пасажирів"
        icon={<Users className="w-5 h-5 text-green-500" />}
        description="Бронювання місць, багаж та інформація про пасажирів."
        headerAction={
          !isClosed && (
            <Button variant="outline" size="sm" onClick={() => addSeat()} disabled={addingSeat}>
              <Plus className="w-4 h-4 mr-1" /> Додати місце
            </Button>
          )
        }
      >
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
                  {!isClosed && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteSeatClick(seat.seat_number)}
                      title="Видалити місце повністю"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
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
                        <p className="font-medium text-xs uppercase tracking-wider mb-1">Багаж:</p>
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

                {!isClosed && (
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant={isOccupied ? 'outline' : 'default'}
                      className="flex-1"
                      onClick={() => handleOpenSeatModal(seat)}
                    >
                      {isOccupied ? (
                        <>
                          <Pencil className="w-4 h-4 mr-2" /> Редагувати
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2 text-indigo-400" /> Забронювати
                        </>
                      )}
                    </Button>
                    {isOccupied && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        title="Звільнити місце"
                        onClick={() => handleClearSeatClick(seat.seat_number)}
                        disabled={clearingSeat}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleCard>

      {/* SEAT MODAL */}
      <Dialog open={isSeatModalOpen} onOpenChange={setIsSeatModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveSeat}>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center pr-4">
                <span>Редагування місця {editingSeatNumber}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEntityHistoryName(`місця ${editingSeatNumber}`);
                    setEntityHistorySearchQuery(`місце ${editingSeatNumber}`);
                    setIsEntityHistoryOpen(true);
                  }}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Історія змін
                </Button>
              </DialogTitle>
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
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      title="Видалити сумку"
                      onClick={() => handleRemoveBaggage(index)}
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
              <Button type="submit" disabled={savingSeat}>
                Зберегти
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PARCELS SECTION */}
      <CollapsibleCard
        title="Передачі"
        icon={<Package className="w-5 h-5 text-orange-500" />}
        description="Управління доставкою передач, адреси та статуси."
        headerAction={
          !isClosed && (
            <Button variant="outline" size="sm" onClick={() => handleOpenParcelModal()}>
              <Plus className="w-4 h-4 mr-2 text-emerald-400" />
              Додати передачу
            </Button>
          )
        }
      >
        <div className="space-y-4">
          {/* Parcel Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук за відправником, телефоном або номером передачі..."
                value={parcelSearchQuery}
                onChange={(e) => setParcelSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={parcelStatusFilter} onValueChange={setParcelStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі статуси</SelectItem>
                  <SelectItem value="pending">Не доставлено</SelectItem>
                  <SelectItem value="delivered">Доставлено</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">№</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => handleParcelSort('sender')}
                  >
                    <div className="flex items-center gap-1">
                      Відправник / Отримувач
                      <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => handleParcelSort('phone')}
                  >
                    <div className="flex items-center gap-1">
                      Контакти
                      <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead>Адреса доставки</TableHead>
                  <TableHead>Опис</TableHead>
                  <TableHead className="text-center">Вага (кг)</TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => handleParcelSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Статус
                      <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedParcels.map((parcel) => (
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
                    <TableCell className="max-w-[150px] truncate" title={parcel.description || ''}>
                      {parcel.description || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center">{parcel.weight}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          checked={parcel.is_delivered}
                          onChange={() => handleToggleParcelDelivered(parcel)}
                          title="Відмітити як доставлено"
                          disabled={isClosed}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isClosed && (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="Редагувати передачу"
                            onClick={() => handleOpenParcelModal(parcel)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            title="Видалити передачу"
                            onClick={() => handleDeleteParcelClick(parcel.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedParcels.length === 0 && !isLoadingParcels && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Немає жодної передачі.
                    </TableCell>
                  </TableRow>
                )}
                {isLoadingParcels && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Завантаження...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {parcelsData && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Показувати по:</span>
                <Select
                  value={parcelLimit.toString()}
                  onValueChange={(val) => {
                    setParcelLimit(Number(val));
                    setParcelPage(1);
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
                  disabled={parcelPage === 1}
                  onClick={() => setParcelPage((p) => Math.max(1, p - 1))}
                >
                  Попередня
                </Button>
                <span className="text-sm px-2 text-muted-foreground">
                  Сторінка {parcelsData.page} з {parcelsData.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!parcelsData.totalPages || parcelPage >= parcelsData.totalPages}
                  onClick={() => setParcelPage((p) => Math.min(parcelsData.totalPages, p + 1))}
                >
                  Наступна
                </Button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* PARCEL MODAL */}
      <Dialog open={isParcelModalOpen} onOpenChange={setIsParcelModalOpen}>
        <DialogContent>
          <form onSubmit={handleSaveParcel}>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center pr-4">
                <span>{editingParcelId ? 'Редагування передачі' : 'Нова передача'}</span>
                {editingParcelId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const parcel = parcelsData?.data.find((p) => p.id === editingParcelId);
                      const pNumber = parcel?.parcel_number || '';
                      setEntityHistoryName(`посилки №${pNumber}`);
                      setEntityHistorySearchQuery(`посилку №${pNumber}`);
                      setIsEntityHistoryOpen(true);
                    }}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Історія змін
                  </Button>
                )}
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
              <div className="space-y-2">
                <Label htmlFor="p_description">Опис посилки (опціонально)</Label>
                <textarea
                  id="p_description"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={parcelForm.description}
                  onChange={(e) => setParcelForm({ ...parcelForm, description: e.target.value })}
                  placeholder="Колір сумки, характерні ознаки..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsParcelModalOpen(false)}>
                Скасувати
              </Button>
              <Button type="submit" disabled={savingParcel}>
                Зберегти
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* HISTORY SECTION */}
      <TripHistoryPanel tripId={tripId} />

      {/* COMPLETE TRIP */}
      {!isClosed && (
        <div className="flex justify-end pt-4">
          <Button
            variant="destructive"
            onClick={() => setCompleteTripConfirmOpen(true)}
            disabled={completingTrip}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Завершити рейс
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={clearSeatConfirmOpen}
        onOpenChange={setClearSeatConfirmOpen}
        title="Звільнити місце?"
        description="Ви дійсно хочете звільнити це місце? Всі дані пасажира (включаючи багаж) будуть видалені."
        confirmLabel="Звільнити"
        confirmVariant="destructive"
        onConfirm={executeClearSeat}
        loading={clearingSeat}
      />

      <ConfirmDialog
        open={deleteSeatConfirmOpen}
        onOpenChange={setDeleteSeatConfirmOpen}
        title="Видалити місце повністю?"
        description="Ви дійсно хочете видалити це місце з рейсу? Ця дія незворотня."
        confirmLabel="Видалити"
        confirmVariant="destructive"
        onConfirm={executeDeleteSeat}
        loading={deletingSeat}
      />
      <ConfirmDialog
        open={deleteParcelConfirmOpen}
        onOpenChange={setDeleteParcelConfirmOpen}
        title="Видалити передачу?"
        description="Ви дійсно хочете повністю видалити цю передачу з рейсу? Вона зникне назавжди."
        confirmLabel="Видалити"
        confirmVariant="destructive"
        onConfirm={executeDeleteParcel}
        loading={deletingParcel}
      />

      <ConfirmDialog
        open={completeTripConfirmOpen}
        onOpenChange={setCompleteTripConfirmOpen}
        title="Завершити рейс?"
        description="Ви дійсно хочете завершити цей рейс? Поточний рейс буде переведено в архів, а для цього автобуса буде створено новий пустий рейс з 7 місцями."
        confirmLabel="Завершити рейс"
        confirmVariant="default"
        onConfirm={executeCompleteTrip}
        loading={completingTrip}
      />

      <EntityHistoryModal
        tripId={tripId}
        searchQuery={entityHistorySearchQuery}
        isOpen={isEntityHistoryOpen}
        onClose={() => setIsEntityHistoryOpen(false)}
        entityName={entityHistoryName}
      />
    </div>
  );
}
