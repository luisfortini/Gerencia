import { FormEvent, useState } from 'react';
import { isAxiosError } from 'axios';
import { Location, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    nome: string;
    papel: string;
    superadmin: boolean;
    conta_id: number | null;
  };
}

const INVALID_CONTA_VALUES = new Set(['', 'null', 'undefined']);

const parseStoredUser = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as { superadmin?: boolean };
  } catch (error) {
    console.warn('Nao foi possivel interpretar os dados armazenados do usuario.', error);
    return null;
  }
};

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('gerencia_token') : null;
  const conta = typeof window !== 'undefined' ? localStorage.getItem('gerencia_conta') : null;
  const storedUser = typeof window !== 'undefined' ? parseStoredUser(localStorage.getItem('gerencia_usuario')) : null;
  const hasConta = conta !== null && !INVALID_CONTA_VALUES.has(conta);
  const isSuperAdmin = storedUser?.superadmin === true;

  if (token && (hasConta || isSuperAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="relative hidden flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-12 text-slate-100 lg:flex">
        <div className="relative z-10 w-full max-w-xl space-y-8">
          <div>
            <span className="mb-3 inline-flex rounded-full border border-sky-500/40 px-4 py-1 text-xs uppercase tracking-wide text-sky-300">
              CRM + IA para WhatsApp
            </span>
            <h1 className="text-4xl font-semibold leading-tight">
              Atualize seus leads automaticamente enquanto sua equipe foca em fechar negocios.
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              Gere insight em tempo real das conversas, identifique objecoes e mantenha o pipeline saudavel com o GerencIA.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
            <p className="text-sm text-slate-300">
              "Implementamos o GerencIA em menos de uma semana e reduzimos o tempo de atualizacao dos leads em 63%." —
              <span className="ml-1 font-medium text-slate-100">Equipe Comercial GrowFast</span>
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%)]" aria-hidden />
      </div>
      <div className="flex w-full max-w-md flex-col justify-center px-6 py-12 text-slate-900 sm:mx-auto">
        <div className="mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 text-lg font-semibold text-white">
            IA
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-900">Entrar no painel</h2>
          <p className="mt-2 text-sm text-slate-500">Informe suas credenciais para acessar o GerencIA.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              E-mail
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="senha">
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
            {isSubmitting ? 'Entrando...' : 'Entrar no app'}
          </Button>
        </form>
        <p className="mt-8 text-center text-xs text-slate-400">
          Precisa de ajuda? Fale com o suporte pelo WhatsApp.
        </p>
      </div>
    </div>
  );
};

