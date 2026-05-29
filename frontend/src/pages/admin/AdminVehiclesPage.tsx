import { useState } from 'react';

import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PageLoader from '@/components/common/PageLoader';
import {
  useGetVehicles,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} from '@/api/services/vehicles/queries';
import { VehicleDto } from '@/api/services/vehicles/requests';

export default function AdminVehiclesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', plate_number: '' });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);

  const { data: vehicles, isLoading } = useGetVehicles();
  const createMutation = useCreateVehicleMutation();
  const updateMutation = useUpdateVehicleMutation();
  const removeMutation = useDeleteVehicleMutation();

  const handleOpenModal = (v?: VehicleDto) => {
    if (v) {
      setEditingId(v.id);
      setForm({ name: v.name, plate_number: v.plate_number || '' });
    } else {
      setEditingId(null);
      setForm({ name: '', plate_number: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      plate_number: form.plate_number || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Управління автобусами</h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2 text-emerald-400" /> Додати автобус
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Номерний знак</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles?.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium text-muted-foreground">{v.id}</TableCell>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.plate_number || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(v)}
                      title="Редагувати автобус"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      title="Видалити автобус"
                      onClick={() => {
                        setVehicleToDelete(v.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {vehicles?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Немає автобусів.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Редагування автобуса' : 'Новий автобус'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="v_name">Назва (напр. Спрінтер 1)</Label>
                <Input
                  id="v_name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v_plate">Номерний знак (опціонально)</Label>
                <Input
                  id="v_plate"
                  value={form.plate_number}
                  onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Скасувати
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Зберегти
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Видалити автобус?"
        description="Ви впевнені? Це неможливо зробити, якщо на автобус вже призначені рейси."
        confirmLabel="Видалити"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (vehicleToDelete !== null) {
            await removeMutation.mutateAsync(vehicleToDelete);
            setDeleteConfirmOpen(false);
          }
        }}
        loading={removeMutation.isPending}
      />
    </div>
  );
}
