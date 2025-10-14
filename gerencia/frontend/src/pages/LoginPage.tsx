import { FormEvent, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Link, Location, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import logoFull from "@/assets/logo-full.svg";
import logoMark from "@/assets/logo-mark.svg";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface LoginResponse {
  token: string;
  usuario?: {
    id: number;
    nome: string;
    papel: string;
    superadmin: boolean;
    admin: boolean;
    conta_id: number | null;
  } | null;
}

const INVALID_CONTA_VALUES = new Set(["", "null", "undefined"]);

const parseLoginResponse = (raw: LoginResponse | string): LoginResponse | null => {
  if (typeof raw === "string") {
    const sanitized = raw.trim().replace(/^\uFEFF/, "");

    const attemptParse = (value: string) => {
      try {
        return JSON.parse(value) as LoginResponse;
      } catch {
        return null;
      }
    };

    let parsed = attemptParse(sanitized);

    if (!parsed) {
      const start = sanitized.indexOf("{");
      const end = sanitized.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        parsed = attemptParse(sanitized.slice(start, end + 1));
      }
    }

    if (!parsed) {
      console.warn("Resposta de login inesperada; nao foi possivel interpretar JSON.", sanitized);
    }

    return parsed;
  }

  if (!raw || typeof raw !== "object") {
    return null;
  }

  return raw;
};

const parseStoredUser = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as { superadmin?: boolean; admin?: boolean };
  } catch (error) {
    console.warn("Nao foi possivel interpretar os dados armazenados do usuario.", error);
    return null;
  }
};

const destaqueItens = [
  "Atualizacao automatica de status por IA proprietaria",
  "Painel gestor com funil em tempo real",
  "Deteccao de objecoes e valores negociados nas conversas",
];

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const fromLocation = (location.state as { from?: Location })?.from;
  const redirectTo = fromLocation?.pathname ?? "/dashboard";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email: email.trim(),
        senha,
      });

      const parsedResponse = parseLoginResponse(data as LoginResponse | string);

      if (!parsedResponse?.token) {
        setError("Nao foi possivel validar a resposta do servidor. Tente novamente em instantes.");
        localStorage.removeItem("gerencia_conta");
        localStorage.removeItem("gerencia_usuario");
        return;
      }

      localStorage.setItem("gerencia_token", parsedResponse.token);

      const usuario = parsedResponse.usuario;

      if (!usuario) {
        setError("Nao foi possivel carregar os dados do usuario. Tente novamente em instantes.");
        localStorage.removeItem("gerencia_conta");
        localStorage.removeItem("gerencia_usuario");
        return;
      }

      if (usuario.conta_id !== null && usuario.conta_id !== undefined) {
        localStorage.setItem("gerencia_conta", String(usuario.conta_id));
      } else {
        localStorage.removeItem("gerencia_conta");
      }

      localStorage.setItem("gerencia_usuario", JSON.stringify(usuario));

      queryClient.clear();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.log(err);
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("Credenciais invalidas. Verifique o e-mail e a senha informados.");
        } else {
          setError("Nao foi possivel realizar o login. Tente novamente em instantes.");
        }
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const { token, hasConta, isSuperAdmin, isAdmin } = useMemo(() => {
    if (typeof window === "undefined") {
      return { token: null, hasConta: false, isSuperAdmin: false, isAdmin: false } as const;
    }

    const storedToken = localStorage.getItem("gerencia_token");
    const conta = localStorage.getItem("gerencia_conta");
    const storedUser = parseStoredUser(localStorage.getItem("gerencia_usuario"));

    return {
      token: storedToken,
      hasConta: conta !== null && !INVALID_CONTA_VALUES.has(conta ?? ""),
      isSuperAdmin: storedUser?.superadmin === true,
      isAdmin: storedUser?.admin === true,
    } as const;
  }, []);

  if (token && (hasConta || isSuperAdmin || isAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border px-12 py-16 text-muted-foreground transition-colors lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-muted dark:from-primary/25 dark:via-transparent dark:to-slate-900" aria-hidden />
        <div className="absolute inset-0 opacity-40 mix-blend-overlay dark:opacity-60" aria-hidden>
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.1),_transparent_60%)]" />
        </div>
        <div className="relative z-10 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-muted-foreground dark:text-muted-foreground/70">
          <div className="flex items-center gap-3">
            <img src={logoMark} alt="GerencIA" className="h-12 w-auto" />
            <span>O CRM que pensa e age</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="relative z-10 mt-16 max-w-xl space-y-8">
          <div className="space-y-5">
            <h1 className="text-3xl font-semibold leading-snug text-foreground dark:text-white">
              Centralize conversas, entenda objecoes e mantenha o funil sempre atualizado.
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground/75">
              O GerencIA interpreta o contexto das mensagens, sugere o proximo passo e da visibilidade aos gestores sobre cada oportunidade.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-muted-foreground dark:text-muted-foreground/70">
            {destaqueItens.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} GerencIA - Inteligencia aplicada ao relacionamento com clientes.</span>
        </div>
      </div>
      <div className="flex w-full max-w-lg flex-col justify-center px-6 py-12 sm:mx-auto">
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-border bg-surface/95 p-8 shadow-xl backdrop-blur-sm transition-colors dark:bg-slate-900/90">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <img src={logoFull} alt="GerencIA" className="h-12 w-auto" />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Bem-vindo de volta</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Acesse o painel com suas credenciais para continuar acompanhando seus leads.
              </p>
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
              <div className="text-right">
                <Link to="/esqueci-senha" className="text-xs font-medium text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar na plataforma'}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Problemas para acessar? Envie um e-mail para <span className="font-medium text-foreground">suporte@crmgerencia.com.br</span>
          </p>
          <div className="mt-6 flex justify-center lg:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};
