import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Bus, Users, Route, History, Building2 } from 'lucide-react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted',
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
  );

const ADMIN_LINKS = [
  { to: '/admin', label: 'Рейси', icon: Route, color: 'text-blue-500', end: true },
  { to: '/admin/history', label: 'Історія рейсів', icon: History, color: 'text-purple-500' },
  { to: '/admin/vehicles', label: 'Автобуси', icon: Bus, color: 'text-orange-500' },
  { to: '/admin/cities', label: 'Міста', icon: Building2, color: 'text-emerald-500' },
  { to: '/admin/users', label: 'Користувачі', icon: Users, color: 'text-pink-500' },
];

export default function AdminLayout() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-48 shrink-0 flex flex-col gap-1">
        <h2 className="px-3 mb-2 text-lg font-semibold tracking-tight">Адміністрування</h2>
        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                <Icon className={cn('w-4 h-4', link.color)} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
