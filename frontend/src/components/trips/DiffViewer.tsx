import React from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const FIELD_MAP: Record<string, string> = {
  departure_city: 'Місто відправлення',
  departure_date: 'Дата відправлення',
  arrival_city: 'Місто прибуття',
  arrival_date: 'Дата прибуття',
  vehicle_id: 'ID Автобуса',
  first_name: "Ім'я",
  last_name: 'Прізвище',
  phone: 'Телефон',
  boarding_address: 'Адреса посадки',
  baggage_info: 'Інформація про багаж',
  weight: 'Вага (кг)',
  name: 'Назва',
  description: 'Опис посилки',
  delivery_address: 'Адреса доставки',
  is_delivered: 'Статус доставки',
  status: 'Статус',
  user_id: 'ID Водія',
  driver: 'Водій',
};

interface DiffViewerProps {
  changes: Record<string, Record<string, unknown>> | null;
}

export function DiffViewer({ changes }: DiffViewerProps) {
  if (!changes) return null;

  const { before, after } = changes;
  const keys = new Set<string>();
  if (before) Object.keys(before).forEach((k) => keys.add(k));
  if (after) Object.keys(after).forEach((k) => keys.add(k));

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground text-xs uppercase">
          <tr>
            <th className="px-4 py-2 border-b">Поле</th>
            {before && <th className="px-4 py-2 border-b text-red-600/80">Було</th>}
            {after && <th className="px-4 py-2 border-b text-green-600/80">Стало</th>}
          </tr>
        </thead>
        <tbody>
          {Array.from(keys).map((key) => {
            const valBefore = before ? before[key] : undefined;
            const valAfter = after ? after[key] : undefined;

            if (JSON.stringify(valBefore) === JSON.stringify(valAfter)) return null;

            const formatVal = (v: unknown): React.ReactNode => {
              if (v === null || v === undefined) return '-';
              if (typeof v === 'boolean') return v ? 'Так' : 'Ні';
              if (Array.isArray(v)) {
                if (v.length === 0) return '-';
                return (
                  <div className="flex flex-col gap-2 text-left">
                    {v.map((item, i) => (
                      <div key={i} className="pl-2 border-l-2 border-muted">
                        {formatVal(item)}
                      </div>
                    ))}
                  </div>
                );
              }
              if (typeof v === 'object') {
                return (
                  <div className="flex flex-col gap-1 text-left">
                    {Object.entries(v as Record<string, unknown>).map(([k, val]) => (
                      <span key={k} className="inline-flex gap-1 flex-wrap">
                        <span className="font-medium text-gray-500">{FIELD_MAP[k] || k}:</span>{' '}
                        {formatVal(val)}
                      </span>
                    ))}
                  </div>
                );
              }
              if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
                try {
                  return format(new Date(v), 'dd.MM.yyyy', { locale: uk });
                } catch {
                  return String(v);
                }
              }
              return String(v);
            };

            const fBefore = formatVal(valBefore);
            const fAfter = formatVal(valAfter);

            return (
              <tr key={key} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-2 font-medium">{FIELD_MAP[key] || key}</td>
                {before && <td className="px-4 py-2 text-red-600/80 break-all">{fBefore}</td>}
                {after && <td className="px-4 py-2 text-green-600/80 break-all">{fAfter}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
