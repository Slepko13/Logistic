import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Activity, Loader2 } from 'lucide-react';
import { useGetTripAuditHistory } from '@/api/services/trips/queries';
import { ACTION_MAP, getEventColor } from './TripHistoryPanel';
import { DiffViewer } from './DiffViewer';
import { TripHistory } from '@/api/services/trips/requests';

interface EntityHistoryModalProps {
  tripId: number;
  searchQuery: string | null; // e.g. "місце 5" or "посилку №A123"
  isOpen: boolean;
  onClose: () => void;
  entityName: string; // e.g. "місця 5" or "посилки №A123"
}

export function EntityHistoryModal({
  tripId,
  searchQuery,
  isOpen,
  onClose,
  entityName,
}: EntityHistoryModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<TripHistory | null>(null);

  const { data, isLoading, error } = useGetTripAuditHistory(
    tripId,
    { search: searchQuery || '', limit: 100 }, // fetch up to 100 latest changes
    !!searchQuery && isOpen,
  );

  const history = data?.data || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Історія змін {entityName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden min-h-[300px]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-full text-red-500">
                Помилка завантаження історії
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Activity className="h-12 w-12 mb-4 opacity-20" />
                <p>Історія змін порожня</p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto pr-4">
                <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-4">
                  {history.map((event) => (
                    <div
                      key={event.id}
                      className={`relative pl-6 py-2 rounded-md transition-colors ${event.changes ? 'hover:bg-muted/50 cursor-pointer' : ''}`}
                      onClick={() => event.changes && setSelectedEvent(event)}
                    >
                      <div
                        className={`absolute w-3 h-3 ${getEventColor(event.action)} rounded-full -left-1.5 top-3.5 ring-4 ring-white`}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {ACTION_MAP[event.action] || event.action}
                        </h4>
                        <time className="text-xs text-gray-500">
                          {format(new Date(event.created_at), 'd MMM yyyy, HH:mm:ss', {
                            locale: uk,
                          })}
                        </time>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{event.details}</div>
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <span className="font-medium">Користувач:</span>
                        {event.user ? (
                          <span>
                            {event.user.first_name} {event.user.last_name} (
                            {event.user.role === 'admin' ? 'Адмін' : 'Водій'})
                          </span>
                        ) : (
                          <span>Система</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Деталі змін -{' '}
              {selectedEvent ? ACTION_MAP[selectedEvent.action] || selectedEvent.action : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <DiffViewer
              changes={(selectedEvent.changes as Record<string, Record<string, unknown>>) || null}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
