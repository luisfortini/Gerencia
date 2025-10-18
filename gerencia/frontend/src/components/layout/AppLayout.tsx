import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Bot, ChevronDown, ChevronLeft, ChevronRight, KeyRound, LayoutDashboard, LogOut, MessageSquare, Settings, UserCog, Users } from 'lucide-react';

import axios from 'axios';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

import logoFull from '@/assets/logo-full.svg';

import logoMark from '@/assets/logo-mark.svg';

import { ThemeToggle } from '@/components/theme/ThemeToggle';

import { Modal } from '@/components/ui/modal';

import { Input } from '@/components/ui/input';

import { api } from '@/lib/api';



type StoredUsuario = { nome?: string; papel?: string; superadmin?: boolean; admin?: boolean } | null;



const links = [

  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },

  { to: '/leads/lista', label: 'Leads - Lista', icon: MessageSquare },

  { to: '/leads/kanban', label: 'Leads - Kanban', icon: Bot },

  { to: '/instancias', label: 'Instâncias WhatsApp', icon: Settings, requiresAdmin: true },
  { to: '/usuarios', label: 'Usuários', icon: UserCog, requiresAdmin: true },
  { to: '/admin', label: 'Admin Global', icon: Users, requiresSuperAdmin: true },

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

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');

  const [novaSenha, setNovaSenha] = useState('');

  const [novaSenhaConfirmacao, setNovaSenhaConfirmacao] = useState('');

  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);



  const usuario = useMemo<StoredUsuario>(() => {

    if (typeof window === 'undefined') {

      return null;

    }



    const raw = localStorage.getItem('gerencia_usuario');

    if (!raw) {

      return null;

    }



    try {

      return JSON.parse(raw) as StoredUsuario;

    } catch (error) {

      console.warn('Não foi possível interpretar os dados do usuário armazenados.', error);

      return null;

    }

  }, []);



  const contaValue = typeof window !== 'undefined' ? localStorage.getItem('gerencia_conta') : null;

  const hasConta = contaValue !== null && !INVALID_CONTA_VALUES.has(contaValue ?? '');

  const userName = usuario?.nome ?? 'Usuário';

  const userRole = usuario?.papel ? usuario.papel.replace(/_/g, ' ') : null;

  const userInitials = getUserInitials(userName || 'G');

  const isSuperAdmin = usuario?.superadmin === true;

  const isAdmin = isSuperAdmin || usuario?.admin === true;

  const tenantLabel = hasConta

    ? `Conta #${contaValue}`

    : isSuperAdmin

      ? 'Super admin'

      : isAdmin

        ? 'Admin'

        : 'Conta não identificada';

  const availableLinks = useMemo(

    () =>

      links.filter((link) => {

        if (link.requiresSuperAdmin && !isSuperAdmin) {

          return false;

        }

        if (link.requiresAdmin && !isAdmin) {

          return false;

        }

        return true;

      }),

    [isAdmin, isSuperAdmin]

  );



  const handleLogout = () => {

    localStorage.removeItem('gerencia_token');

    localStorage.removeItem('gerencia_conta');

    localStorage.removeItem('gerencia_usuario');

    navigate('/login', { replace: true });

  };



  const handlePasswordModalChange = useCallback((open: boolean) => {

    setIsPasswordModalOpen(open);

    if (!open) {

      setSenhaAtual('');

      setNovaSenha('');

      setNovaSenhaConfirmacao('');

      setPasswordError(null);

      setPasswordLoading(false);

    }

  }, []);



  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    setPasswordLoading(true);

    setPasswordError(null);



    try {

      const response = await api.put('/auth/password', {

        senha_atual: senhaAtual,

        nova_senha: novaSenha,

        nova_senha_confirmation: novaSenhaConfirmacao,

      });



      const novoToken = response.data?.token as string | undefined;

      if (novoToken) {

        localStorage.setItem('gerencia_token', novoToken);

        api.defaults.headers.common.Authorization = `Bearer ${novoToken}`;

      }



      const usuarioAtualizado = response.data?.usuario as StoredUsuario;

      if (usuarioAtualizado) {

        localStorage.setItem('gerencia_usuario', JSON.stringify(usuarioAtualizado));

      }



      window.alert('Senha atualizada com sucesso.');

      handlePasswordModalChange(false);

    } catch (error) {

      let message = 'Não foi possível atualizar a senha. Tente novamente.';

      if (axios.isAxiosError(error)) {

        const responseMessage = error.response?.data?.message;

        if (typeof responseMessage === 'string') {

          message = responseMessage;

        } else if (error.response?.status === 422) {

          const errors = error.response.data?.errors;

          if (errors && typeof errors === 'object') {

            const first = Object.values(errors).flat()[0];

            if (typeof first === 'string') {

              message = first;

            }

          }

        }

      }

      setPasswordError(message);

    } finally {

      setPasswordLoading(false);

    }

  };



  const toggleUserMenu = () => {

    setIsUserMenuOpen((prev) => !prev);

  };



  const closeUserMenu = useCallback(() => setIsUserMenuOpen(false), []);



  useEffect(() => {

    if (!isUserMenuOpen) {

      return;

    }



    const handleClickOutside = (event: MouseEvent) => {

      if (!userMenuRef.current) {

        return;

      }

      if (!userMenuRef.current.contains(event.target as Node)) {

        setIsUserMenuOpen(false);

      }

    };



    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, [isUserMenuOpen]);



  return (

    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      <aside

        className={cn(

          'relative hidden h-full flex-col border-r border-border bg-surface shadow-sm transition-all duration-200 md:flex',

          isSidebarCollapsed ? 'w-20 px-3 py-6' : 'w-64 p-6'

        )}

      >

        <button

          type="button"

          onClick={() => setIsSidebarCollapsed((prev) => !prev)}

          className="absolute -right-3 top-6 hidden h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary md:flex"

          aria-label={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}

        >

          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}

        </button>

        <div

          className={cn(

            'mb-8 flex items-center',

            isSidebarCollapsed ? 'justify-center' : 'justify-between'

          )}

        >

          <img

            src={isSidebarCollapsed ? logoMark : logoFull}

            alt="GerencIA"

            className={cn('transition-all', isSidebarCollapsed ? 'h-10 w-10' : 'h-12 w-auto')}

          />

          {!isSidebarCollapsed ? <ThemeToggle /> : null}

        </div>

        <nav className="flex flex-1 flex-col gap-1">

          {availableLinks.map((link) => {

            const Icon = link.icon;

            const active = location.pathname.startsWith(link.to);

            return (

              <Link

                key={link.to}

                to={link.to}

                title={link.label}

                aria-label={link.label}

                className={cn(

                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition',

                  !isSidebarCollapsed && 'gap-2',

                  isSidebarCollapsed && 'justify-center',

                  active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-subtle hover:bg-muted/60 hover:text-foreground'

                )}

              >

                <Icon className="h-4 w-4" />

                {!isSidebarCollapsed ? <span>{link.label}</span> : null}

              </Link>

            );

          })}

        </nav>

        <div className="mt-6">

          <Button

            variant="ghost"

            className={cn('w-full justify-start', isSidebarCollapsed && 'justify-center')}

            onClick={handleLogout}

            title="Sair da conta"

          >

            <LogOut className={cn('h-4 w-4', !isSidebarCollapsed && 'mr-2')} />

            {!isSidebarCollapsed ? <span>Sair da conta</span> : null}

          </Button>

        </div>

      </aside>

      <div className="flex h-full flex-1 flex-col overflow-hidden">

        <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border bg-surface/95 px-4 py-4 shadow-sm backdrop-blur transition md:flex-row md:items-center md:justify-between md:px-6">

          <div className="flex items-center gap-3">

            <img src={logoMark} alt="GerencIA simbolo" className="h-10 w-auto md:hidden" />

            <div>

              <h1 className="text-xl font-semibold text-foreground">Painel GerêncIA</h1>

              <p className="text-sm text-muted-foreground">Monitoramento em tempo real das conversas e status dos leads.</p>

            </div>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <ThemeToggle />

            <div className="relative" ref={userMenuRef}>

              <button

                type="button"

                onClick={toggleUserMenu}

                className="flex items-center gap-3 rounded-full border border-border bg-surface px-3 py-2 text-left text-sm font-medium shadow-sm transition hover:border-primary/40"

              >

                <div className="text-right">

                  <p className="font-semibold text-foreground">{userName}</p>

                  <p className="text-xs text-muted-foreground">{userRole ?? tenantLabel}</p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold uppercase text-primary">

                  {userInitials}

                </div>

                <ChevronDown className="h-4 w-4 text-muted-foreground" />

              </button>

              {isUserMenuOpen ? (

                <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-border bg-surface p-2 shadow-lg">

                  <button

                    type="button"

                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-muted/60"

                    onClick={() => {

                      closeUserMenu();

                      handlePasswordModalChange(true);

                    }}

                  >

                    <KeyRound className="h-4 w-4" />

                    Alterar senha

                  </button>

                  <button

                    type="button"

                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition hover:bg-muted/60"

                    onClick={handleLogout}

                  >

                    <LogOut className="h-4 w-4" />

                    Sair da conta

                  </button>

                </div>

              ) : null}

            </div>

          </div>

        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin bg-background p-4 md:p-6">{children}</main>

      </div>

      <Modal

        open={isPasswordModalOpen}

        onOpenChange={(open) => {

          handlePasswordModalChange(open);

          if (open) {

            closeUserMenu();

          }

        }}

        title="Alterar senha"

        description="Informe a senha atual e a nova senha para atualizar seu acesso."

        footer={

          <div className="flex gap-2">

            <Button type="button" variant="ghost" onClick={() => handlePasswordModalChange(false)} disabled={passwordLoading}>

              Cancelar

            </Button>

            <Button type="submit" form="alterar-senha-form" disabled={passwordLoading}>

              {passwordLoading ? 'Salvando...' : 'Atualizar senha'}

            </Button>

          </div>

        }

      >

        <form id="alterar-senha-form" className="space-y-4" onSubmit={handlePasswordSubmit}>

          <div className="space-y-2">

            <label className="text-sm font-medium text-foreground" htmlFor="senha-atual">

              Senha atual

            </label>

            <Input id="senha-atual" type="password" required value={senhaAtual} onChange={(event) => setSenhaAtual(event.target.value)} />

          </div>

          <div className="space-y-2">

            <label className="text-sm font-medium text-foreground" htmlFor="nova-senha">

              Nova senha

            </label>

            <Input

              id="nova-senha"

              type="password"

              required

              minLength={8}

              value={novaSenha}

              onChange={(event) => setNovaSenha(event.target.value)}

            />

          </div>

          <div className="space-y-2">

            <label className="text-sm font-medium text-foreground" htmlFor="confirmacao-senha">
              Confirmar nova senha

            </label>

            <Input

              id="confirmacao-senha"
              type="password"

              required

              minLength={8}

              value={novaSenhaConfirmacao}

              onChange={(event) => setNovaSenhaConfirmacao(event.target.value)}

            />

          </div>

          {passwordError ? <p className="text-sm text-red-500">{passwordError}</p> : null}

        </form>

      </Modal>

    </div>

  );

};

