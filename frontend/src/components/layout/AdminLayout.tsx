import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Bus, Map, Users } from 'lucide-react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted',
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
  );

const ADMIN_LINKS = [
  { to: '/admin', label: 'Рейси', icon: Map, end: true },
  { to: '/admin/vehicles', label: 'Автобуси', icon: Bus },
  { to: '/admin/cities', label: 'Міста', icon: Map },
  { to: '/admin/users', label: 'Користувачі', icon: Users },
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
                <Icon className="w-4 h-4" />
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
