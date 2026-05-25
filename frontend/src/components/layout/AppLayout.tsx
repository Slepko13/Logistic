import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS, UserRoleType } from '@/constants/userRole';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
  );

const NAV_LINKS = [
  { to: '/', label: 'Панель', icon: LayoutDashboard, end: true },
  { to: '/admin', label: 'Адмін-панель', icon: Users, adminOnly: true },
];

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="mb-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Logistic</h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {user?.last_name} {user?.first_name} · {user?.phone}
              </span>
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {user?.role ? ROLE_LABELS[user.role as UserRoleType] || user.role : ''}
              </Badge>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Вийти
            </Button>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Основна навігація">
          {NAV_LINKS.map((link) => {
            if (link.adminOnly && !isAdmin) return null;
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
