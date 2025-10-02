import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Bot, LayoutDashboard, LogOut, MessageSquare, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads/lista', label: 'Leads - Lista', icon: MessageSquare },
  { to: '/leads/kanban', label: 'Leads - Kanban', icon: Bot },
  { to: '/instancias', label: 'Instancias WhatsApp', icon: Settings },
  { to: '/admin', label: 'Admin Global', icon: Users },
];

const INVALID_CONTA_VALUES = new Set(['', 'null', 'undefined']);

const getUserInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const usuario = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem('gerencia_usuario');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as { nome?: string; papel?: string; superadmin?: boolean };
    } catch (error) {
      console.warn('Nao foi possivel interpretar os dados do usuario armazenados.', error);
      return null;
    }
  }, []);

  const contaValue = typeof window !== 'undefined' ? localStorage.getItem('gerencia_conta') : null;
  const hasConta = contaValue !== null && !INVALID_CONTA_VALUES.has(contaValue);
  const userName = usuario?.nome ?? 'Usuario';
  const userRole = usuario?.papel ? usuario.papel.replace(/_/g, ' ') : null;
  const userInitials = getUserInitials(userName || 'G');
  const tenantLabel = hasConta ? `Conta #${contaValue}` : usuario?.superadmin ? 'Super admin' : 'Conta nao identificada';

  const handleLogout = () => {
    localStorage.removeItem('gerencia_token');
    localStorage.removeItem('gerencia_conta');
    localStorage.removeItem('gerencia_usuario');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="hidden w-64 flex-col border-r border-border bg-white p-6 md:flex">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">IA</div>
          <div>
            <p className="text-lg font-semibold text-gray-900">GerencIA</p>
            <span className="text-xs text-gray-500">CRM Assistido por IA</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 space-y-3">
          <Button variant="outline" className="w-full">
            <BarChart3 className="mr-2 h-4 w-4" /> KPI Semanal
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair da conta
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex flex-col gap-4 border-b border-border bg-white px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Painel GerencIA</h1>
            <p className="text-sm text-gray-500">Monitoramento em tempo real das conversas e status dos leads.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{userName}</p>
              <p className="text-xs text-gray-500">{userRole ?? tenantLabel}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold uppercase">
              {userInitials}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="md:hidden">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};
