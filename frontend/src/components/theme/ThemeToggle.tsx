import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled aria-hidden>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = (resolvedTheme ?? theme) === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Світла тема' : 'Темна тема'}
      aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
