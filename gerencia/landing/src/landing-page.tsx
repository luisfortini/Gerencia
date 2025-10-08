import { useMemo, useState } from "react";
import logoFull from "./assets/logo-full.svg";
import logoMark from "./assets/logo-mark.svg";

const beneficios = [
  "Status dos leads atualizados automaticamente pela IA",
  "Monitoramento em tempo real das conversas no WhatsApp",
  "Detecção automática de objeções (Preço, Urgência e mais)",
  "Kanban inteligente com confirmação orientada por dados",
];

const passos = [
  {
    destaque: "Conecte",
    descricao: "Associe sua instância Evolution API com poucos cliques e selecione quais filas acompanhar.",
  },
  {
    destaque: "Aprenda",
    descricao: "A IA interpreta cada mensagem em segundos, identifica objeções e calcula o próximo status sugerido.",
  },
  {
    destaque: "Escale",
    descricao: "Gestores validam as sugestões no Kanban, liberando a equipe para focar nas conversas decisivas.",
  },
];

const faq = [
  {
    pergunta: "Preciso instalar algo no meu WhatsApp?",
    resposta: "Não. Basta conectar sua instância Evolution API e a GerencIA cuida do restante com atualizações automáticas.",
  },
  {
    pergunta: "Quantos usuários posso cadastrar?",
    resposta: "Cadastre gestores e operadores ilimitados. Os controles de acesso são definimos diretamente no painel.",
  },
  {
    pergunta: "Posso mudar de plano quando quiser?",
    resposta: "Sim, é possível alternar entre o plano mensal e anual a qualquer momento, sem taxas ocultas.",
  },
];

const recursosPlano = [
  "1 instância WhatsApp inclusa (limite gerenciado no painel)",
  "IA proprietária Tier-1 com fallback OpenAI automático",
  "Dashboard gestor com KPIs, alertas de SLA e funil em tempo real",
  "Kanban inteligente com contexto de mensagens e campo obrigatório em Ganho",
];

export const LandingPage = () => {
  const [plano, setPlano] = useState<"mensal" | "anual">("mensal");
  const appUrl = import.meta.env.VITE_APP_URL ?? "http://localhost:5175";

  const { preco, descricao } = useMemo(() => {
    if (plano === "mensal") {
      return { preco: "R$ 99/mês", descricao: "Cobrança recorrente mensal sem fidelidade." };
    }

    return { preco: "R$ 79,90/mês", descricao: "Economize 19% com a cobrança anual antecipada." };
  }, [plano]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090b18] text-brand-silver">
      <DecoracaoHero />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm">
        <a href="#hero" className="flex items-center gap-3">
          <img src={logoFull} alt="GerencIA" className="hidden h-12 w-auto md:block" />
          <img src={logoMark} alt="GerencIA" className="h-11 w-auto md:hidden" />
        </a>
        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.2em] text-brand-silver/70 md:flex">
          <a className="transition hover:text-white" href="#como-funciona">
            Como funciona
          </a>
          <a className="transition hover:text-white" href="#beneficios">
            Benefícios
          </a>
          <a className="transition hover:text-white" href="#preco">
            Plano
          </a>
          <a className="transition hover:text-white" href="#faq">
            FAQ
          </a>
        </nav>
        <a
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white/10"
          href={`${appUrl}/login`}
        >
          Entrar
        </a>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20" id="hero">
        <section className="py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-brand-silver/80">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-silver/60" aria-hidden />
            CRM que pensa e age com você
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white md:text-5xl">
            Leads organizados, objeções claras e seu time focado no que fecha negócio.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-silver/80">
            Centralize conversas do WhatsApp, monitore o funil em tempo real e deixe a IA atualizar os status. Você acompanha as métricas certas e age no momento certo.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row">
            <a
              href={`${appUrl}/login`}
              className="w-full rounded-full bg-brand-navy px-8 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-brand-navy/40 transition hover:bg-brand-navyDark md:w-auto"
            >
              Começar agora
            </a>
            <a
              href="#como-funciona"
              className="group inline-flex items-center gap-2 text-sm font-medium text-brand-silver transition hover:text-white"
            >
              Ver como funciona
              <span className="translate-y-[1px] transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </section>

        <section id="como-funciona" className="rounded-3xl border border-white/10 bg-white/6 p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold text-white">Como a jornada acontece</h2>
          <p className="mt-2 text-sm text-brand-silver/70">
            Em poucos passos a sua operação começa a rodar com inteligência assistida.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {passos.map((passo) => (
              <Passo key={passo.destaque} destaque={passo.destaque} descricao={passo.descricao} />
            ))}
          </div>
        </section>

        <section id="beneficios" className="mt-20">
          <div className="flex flex-col gap-3 text-left md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Por que equipes escolhem a GerencIA</h2>
              <p className="mt-2 max-w-xl text-sm text-brand-silver/70">Automação de status, insights acionáveis e um painel que fala a língua do gestor comercial.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-brand-silver/80">
              Resultados em dias, não meses
            </span>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {beneficios.map((beneficio) => (
              <li key={beneficio} className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-5 transition hover:border-brand-silver/40">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy/40 text-sm font-semibold text-white">
                  ✓
                </span>
                <p className="text-sm text-brand-silver group-hover:text-white">{beneficio}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="preco" className="mt-24 text-center">
          <span className="text-[11px] uppercase tracking-[0.28em] text-brand-silver/70">Plano único</span>
          <h2 className="mt-4 text-3xl font-semibold text-white">Simples de contratar, fácil de escalar</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-brand-silver/70">
            Comece hoje mesmo e ajuste o ritmo conforme a evolução do seu time comercial.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] p-2">
            <ToggleButton ativo={plano === "mensal"} onClick={() => setPlano("mensal")} label="Mensal" />
            <ToggleButton ativo={plano === "anual"} onClick={() => setPlano("anual")} label="Anual" badge="-19%" />
          </div>
          <div className="mx-auto mt-10 max-w-lg rounded-3xl border border-white/10 bg-white/[0.08] p-10 text-left text-brand-silver shadow-lg shadow-black/30">
            <p className="text-xs uppercase tracking-[0.28em] text-brand-silver/70">Tudo incluso</p>
            <p className="mt-4 text-4xl font-semibold text-white">{preco}</p>
            <p className="mt-2 text-sm text-brand-silver/80">{descricao}</p>
            <ul className="mt-8 space-y-3 text-sm">
              {recursosPlano.map((recurso) => (
                <li key={recurso} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-silver" aria-hidden />
                  <span>{recurso}</span>
                </li>
              ))}
            </ul>
            <a
              href={`${appUrl}/login`}
              className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-brand-navy px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-navy/35 transition hover:bg-brand-navyDark"
            >
              Quero testar na minha operação
            </a>
          </div>
        </section>

        <section id="faq" className="mt-24">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Perguntas frequentes</h2>
              <p className="mt-2 max-w-xl text-sm text-brand-silver/70">
                Transparência desde o primeiro contato. Fale com nosso time caso queira um diagnóstico guiado.
              </p>
            </div>
            <a
              href="mailto:contato@gerencia.ai"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-silver transition hover:border-white/20 hover:text-white"
            >
              Falar com vendas
            </a>
          </div>
          <div className="mt-8 space-y-4">
            {faq.map((item) => (
              <div key={item.pergunta} className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5">
                <p className="text-sm font-semibold text-white">{item.pergunta}</p>
                <p className="mt-2 text-sm text-brand-silver/80">{item.resposta}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#060711]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 text-xs text-brand-silver/70 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} GerencIA. Todos os direitos reservados.</span>
          <div className="flex flex-wrap gap-4">
            <a className="transition hover:text-white" href="#">
              Política de Privacidade
            </a>
            <a className="transition hover:text-white" href="#">
              Termos de Uso
            </a>
            <a className="transition hover:text-white" href="#">
              LGPD
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ToggleButton = ({ ativo, label, onClick, badge }: { ativo: boolean; label: string; onClick: () => void; badge?: string }) => (
  <button
    className={`group relative rounded-full px-6 py-2 text-sm font-medium transition ${
      ativo ? "bg-white text-brand-navy shadow" : "text-brand-silver/80 hover:text-white"
    }`}
    onClick={onClick}
    type="button"
  >
    {label}
    {badge ? (
      <span className="absolute -right-4 -top-2 inline-flex items-center rounded-full bg-brand-navy px-2 py-[2px] text-[10px] font-semibold uppercase tracking-widest text-white shadow-sm shadow-brand-navy/40">
        {badge}
      </span>
    ) : null}
  </button>
);

const Passo = ({ destaque, descricao }: { destaque: string; descricao: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-sm shadow-black/10">
    <p className="text-sm font-semibold text-white">{destaque}</p>
    <p className="mt-2 text-sm text-brand-silver/80">{descricao}</p>
  </div>
);

const DecoracaoHero = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
    <div className="absolute -top-24 left-1/2 h-96 w-[620px] -translate-x-1/2 rounded-full bg-brand-navy/45 blur-3xl" />
    <div className="absolute bottom-[-160px] left-12 h-80 w-80 rounded-full bg-brand-silver/20 blur-3xl" />
    <div className="absolute bottom-[-120px] right-[-60px] h-[420px] w-[420px] rounded-full bg-brand-navyDark/40 blur-3xl" />
  </div>
);
