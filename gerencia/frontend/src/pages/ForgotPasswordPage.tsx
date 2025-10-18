import { FormEvent, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import logoFull from '@/assets/logo-full.svg';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', {
        email: email.trim(),
      });
      setMessage(data.message ?? 'Se o e-mail estiver cadastrado, enviaremos instrucoes para recuperar a senha em instantes.');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.code === 'ERR_NETWORK') {
          setError('Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente em instantes.');
        } else {
          const feedback = err.response?.data?.message ?? 'Não foi possível iniciar a recuperação de senha.';
          setError(typeof feedback === 'string' ? feedback : 'Não foi possível iniciar a recuperação de senha.');
        }
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente em instantes.');
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
            <h1 className="text-xl font-semibold text-foreground">Recuperacao de senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe o e-mail cadastrado para receber o link de redefinicao.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="forgot-email">
              E-mail
            </label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="nome@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {message ? <p className="text-sm text-green-600">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar instrucoes'}
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

export default ForgotPasswordPage;
