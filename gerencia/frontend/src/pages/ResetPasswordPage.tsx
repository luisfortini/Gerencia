import { FormEvent, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import logoFull from '@/assets/logo-full.svg';

export const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tokenFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token') ?? '';
  }, [location.search]);

  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const { data } = await api.post<{ message: string }>('/auth/reset-password', {
        email: email.trim(),
        token: token.trim(),
        senha,
        senha_confirmation: confirmacao,
      });

      setMessage(data.message ?? 'Senha redefinida com sucesso.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      if (isAxiosError(err)) {
        const feedback = err.response?.data?.message ?? 'Não foi possível redefinir a senha.';
        setError(typeof feedback === 'string' ? feedback : 'Não foi possível redefinir a senha.');
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface/95 p-8 shadow-lg backdrop-blur">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={logoFull} alt="GerencIA" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Redefinir senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe o e-mail cadastrado, o token recebido e escolha uma nova senha.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-email">
              E-mail
            </label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="nome@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-token">
              Token
            </label>
            <Input
              id="reset-token"
              type="text"
              placeholder="Cole o token recebido por e-mail"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-password">
              Nova senha
            </label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="********"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-confirmacao">
              Confirmar nova senha
            </label>
            <Input
              id="reset-confirmacao"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="********"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              required
            />
          </div>
          {message ? <p className="text-sm text-green-600">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

