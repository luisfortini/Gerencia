import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from './ThemeProvider';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Alternar tema entre claro e escuro"
      className="relative"
    >
      <Sun aria-hidden className={cn('h-5 w-5 text-primary transition-opacity', theme === 'dark' && 'opacity-0')} />
      <Moon aria-hidden className={cn('absolute h-5 w-5 text-primary transition-opacity', theme === 'light' && 'opacity-0')} />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
};
