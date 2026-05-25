import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PageLoader from '@/components/common/PageLoader';
import * as citiesApi from '@/api/cities';

export default function AdminCitiesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '' });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<number | null>(null);

  const { data: cities, isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: citiesApi.fetchCities,
  });

  const createMutation = useMutation({
    mutationFn: citiesApi.createCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('Місто додано');
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message || 'Помилка додавання міста'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      citiesApi.updateCity(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('Місто оновлено');
      setIsModalOpen(false);
    },
    onError: (e: any) => toast.error(e.message || 'Помилка оновлення міста'),
  });

  const removeMutation = useMutation({
    mutationFn: citiesApi.removeCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('Місто видалено');
      setDeleteConfirmOpen(false);
    },
    onError: (e: any) => {
      toast.error(e.message || 'Помилка видалення міста');
      setDeleteConfirmOpen(false);
    },
  });

  const handleOpenModal = (c?: citiesApi.City) => {
    if (c) {
      setEditingId(c.id);
      setForm({ name: c.name });
    } else {
      setEditingId(null);
      setForm({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Словник міст</h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" /> Додати місто
        </Button>
      </div>

      <div className="rounded-md border bg-card max-w-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Назва міста</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-muted-foreground">{c.id}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(c)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setCityToDelete(c.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {cities?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Немає міст. Додайте перше місто.
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
              <DialogTitle>{editingId ? 'Редагування міста' : 'Нове місто'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="c_name">Назва міста</Label>
                <Input
                  id="c_name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
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
        title="Видалити місто?"
        description="Ви впевнені? Зверніть увагу: це місто пропаде з випадаючих списків."
        confirmLabel="Видалити"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (cityToDelete !== null) {
            await removeMutation.mutateAsync(cityToDelete);
          }
        }}
        loading={removeMutation.isPending}
      />
    </div>
  );
}
