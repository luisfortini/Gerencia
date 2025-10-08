import { FormEvent, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Location, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import logoFull from '@/assets/logo-full.svg';
import logoMark from '@/assets/logo-mark.svg';

interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    nome: string;
    papel: string;
    superadmin: boolean;
    admin: boolean;
    conta_id: number | null;
  };
}

const INVALID_CONTA_VALUES = new Set(['', 'null', 'undefined']);

const parseStoredUser = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as { superadmin?: boolean; admin?: boolean };
  } catch (error) {
    console.warn('Nao foi possivel interpretar os dados armazenados do usuario.', error);
    return null;
  }
};

const destaqueItens = [
  'Atualizacao automatica de status por IA proprietaria',
  'Painel gestor com funil em tempo real',
  'Deteccao de objecoes e valores negociados nas conversas',
];

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const fromLocation = (location.state as { from?: Location })?.from;
  const redirectTo = fromLocation?.pathname ?? '/dashboard';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        email: email.trim(),
        senha,
      });

      localStorage.setItem('gerencia_token', data.token);

      if (data.usuario.conta_id !== null && data.usuario.conta_id !== undefined) {
        localStorage.setItem('gerencia_conta', String(data.usuario.conta_id));
      } else {
        localStorage.removeItem('gerencia_conta');
      }

      localStorage.setItem('gerencia_usuario', JSON.stringify(data.usuario));

      queryClient.clear();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Credenciais invalidas. Verifique o e-mail e a senha informados.');
        } else {
          setError('Nao foi possivel realizar o login. Tente novamente em instantes.');
        }
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const { token, hasConta, isSuperAdmin, isAdmin } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { token: null, hasConta: false, isSuperAdmin: false, isAdmin: false } as const;
    }

    const storedToken = localStorage.getItem('gerencia_token');
    const conta = localStorage.getItem('gerencia_conta');
    const storedUser = parseStoredUser(localStorage.getItem('gerencia_usuario'));

    return {
      token: storedToken,
      hasConta: conta !== null && !INVALID_CONTA_VALUES.has(conta ?? ''),
      isSuperAdmin: storedUser?.superadmin === true,
      isAdmin: storedUser?.admin === true,
    } as const;
  }, []);

  if (token && (hasConta || isSuperAdmin || isAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border bg-[radial-gradient(circle_at_top_left,_rgba(31,37,75,0.45),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(171,171,174,0.25),_transparent_55%),_linear-gradient(160deg,_#11152b_0%,_#090b18_100%)] px-12 py-16 text-brand-silver lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04),_transparent_65%)]" aria-hidden />
        <div className="relative z-10 flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-brand-silver/70">
          <img src={logoMark} alt="GerencIA" className="h-12 w-auto" />
          <span>O CRM que pensa e age</span>
        </div>
        <div className="relative z-10 mt-16 max-w-xl space-y-8">
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight text-white">
              Centralize conversas, entenda objecoes e mantenha o funil sempre atualizado.
            </h1>
            <p className="text-sm text-brand-silver/80">
              O GerencIA interpreta o contexto das mensagens, sugere o proximo passo e da visibilidade aos gestores sobre cada oportunidade.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-brand-silver/85">
            {destaqueItens.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-silver" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 text-xs text-brand-silver/60">
          © {new Date().getFullYear()} GerencIA • Inteligencia aplicada ao relacionamento com clientes.
        </div>
      </div>
      <div className="flex w-full max-w-lg flex-col justify-center px-6 py-12 sm:mx-auto">
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-border bg-surface/90 p-8 shadow-lg backdrop-blur">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <img src={logoFull} alt="GerencIA" className="h-12 w-auto" />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Bem-vindo de volta</h2>
              <p className="mt-2 text-sm text-muted-foreground">Acesse o painel com suas credenciais para continuar acompanhando seus leads.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                E-mail corporativo
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-foreground" htmlFor="senha">
                Senha
              </label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="********"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar na plataforma'}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Problemas para acessar? Envie um e-mail para <span className="font-medium text-foreground">suporte@gerencia.ai</span>
          </p>
        </div>
      </div>
    </div>
  );
};
