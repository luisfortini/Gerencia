import { useMemo, useState } from 'react';

const beneficios = [
  'Status dos leads atualizados automaticamente pela IA',
  'Monitoramento em tempo real das conversas no WhatsApp',
  'Detecção automática de objeções (Preço, Tempo e mais)',
  'Kanban inteligente com confirmação de Ganho',
];

const faq = [
  {
    pergunta: 'Preciso instalar algo no meu WhatsApp?',
    resposta: 'Não. Basta conectar sua instância Evolution API e a GerencIA cuida do restante.',
  },
  {
    pergunta: 'Quantos usuários posso cadastrar?',
    resposta: 'Você pode cadastrar gestores e operadores ilimitados dentro da sua conta.',
  },
  {
    pergunta: 'Posso mudar de plano quando quiser?',
    resposta: 'Sim. A qualquer momento você pode solicitar a alteração entre o plano mensal e o anual.',
  },
];

const recursosPlano = [
  '1 instância WhatsApp inclusa (limite controlado pelo painel)',
  'IA Tier-1 instantânea + fallback OpenAI',
  'Dashboard gestor com KPIs e alertas SLA',
  'Kanban inteligente com modal obrigatório em Ganho',
];

export const LandingPage = () => {
  const [plano, setPlano] = useState<'mensal' | 'anual'>('mensal');
  const appUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:5175';

  const { preco, descricao } = useMemo(() => {
    if (plano === 'mensal') {
      return { preco: 'R$ 99/mês', descricao: 'Cobrança recorrente mensal' };
    }

    return { preco: 'R$ 79,90/mês', descricao: 'Economize 19% com a cobrança anual' };
  }, [plano]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-lg font-bold text-white">IA</div>
          <div>
            <strong className="block text-base text-white">GerencIA</strong>
            <p className="text-xs text-slate-400">CRM SaaS com IA + WhatsApp</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <a className="text-xs uppercase tracking-wide text-slate-300 transition hover:text-white" href="#como-funciona">
            Como funciona
          </a>
          <a className="text-xs uppercase tracking-wide text-slate-300 transition hover:text-white" href="#beneficios">
            Benefícios
          </a>
          <a className="text-xs uppercase tracking-wide text-slate-300 transition hover:text-white" href="#preco">
            Preço
          </a>
          <a className="text-xs uppercase tracking-wide text-slate-300 transition hover:text-white" href="#faq">
            FAQ
          </a>
        </nav>
        <a
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-white/10"
          href={`${appUrl}/login`}
        >
          Entrar no app
        </a>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        <section className="py-20 text-center" id="hero">
          <span className="inline-flex rounded-full border border-sky-500/30 px-4 py-1 text-xs uppercase tracking-wide text-sky-300">
            CRM atualizado automaticamente pela IA
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-50 md:text-5xl">
            Nunca mais perca um lead por falta de atualização.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            A GerencIA analisa conversas em tempo real no WhatsApp, identifica objeções, extrai valores e atualiza o status dos leads com precisão.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row">
            <a
              href={`${appUrl}/login`}
              className="w-full rounded-full bg-sky-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:bg-sky-600 md:w-auto"
            >
              Assine agora
            </a>
            <a href="#como-funciona" className="text-sm font-medium text-slate-200 transition hover:text-white">
              Ver como funciona
            </a>
          </div>
        </section>

        <section id="como-funciona" className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 backdrop-blur">
          <h2 className="text-2xl font-semibold text-slate-100">Como funciona</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Passo destaque="Conecte" descricao="Associe sua instância Evolution API em minutos." />
            <Passo destaque="Monitore" descricao="A IA interpreta cada mensagem e propõe o próximo status." />
            <Passo destaque="Aja" descricao="Gestores e operadores validam sugestões diretamente no Kanban." />
          </div>
        </section>

        <section id="beneficios" className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-100">Por que equipes escolhem a GerencIA</h2>
          <ul className="mt-6 grid gap-4">
            {beneficios.map((beneficio) => (
              <li key={beneficio} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-300">✔</span>
                <p className="text-sm text-slate-200">{beneficio}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="preco" className="mt-20 text-center">
          <span className="text-xs uppercase tracking-wide text-sky-300">Plano único</span>
          <h2 className="mt-4 text-3xl font-semibold text-slate-100">Preço transparente</h2>
          <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white/5 p-2 shadow-inner shadow-black/20">
            <button
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${plano === 'mensal' ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:text-white'}`}
              onClick={() => setPlano('mensal')}
            >
              Mensal
            </button>
            <button
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${plano === 'anual' ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:text-white'}`}
              onClick={() => setPlano('anual')}
            >
              Anual
            </button>
          </div>
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 text-slate-50 shadow-lg shadow-black/20">
            <p className="text-sm uppercase tracking-wide text-sky-200">Tudo incluso</p>
            <p className="mt-3 text-4xl font-semibold">{preco}</p>
            <p className="mt-2 text-sm text-slate-200">{descricao}</p>
            <ul className="mt-6 space-y-3 text-left text-sm text-slate-100">
              {recursosPlano.map((recurso) => (
                <li key={recurso} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" aria-hidden />
                  <span>{recurso}</span>
                </li>
              ))}
            </ul>
            <a
              href={`${appUrl}/login`}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-600"
            >
              Quero começar agora
            </a>
          </div>
        </section>

        <section id="faq" className="mt-20">
          <h2 className="text-2xl font-semibold text-slate-100">Perguntas frequentes</h2>
          <div className="mt-6 space-y-4">
            {faq.map((item) => (
              <div key={item.pergunta} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
                <p className="text-sm font-semibold text-slate-100">{item.pergunta}</p>
                <p className="mt-2 text-sm text-slate-300">{item.resposta}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} GerencIA. Todos os direitos reservados.</span>
          <div className="flex flex-wrap gap-4">
            <a className="transition hover:text-white" href="#">Política de Privacidade</a>
            <a className="transition hover:text-white" href="#">Termos de Uso</a>
            <a className="transition hover:text-white" href="#">LGPD</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Passo = ({ destaque, descricao }: { destaque: string; descricao: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
    <p className="text-sm font-semibold text-sky-200">{destaque}</p>
    <p className="mt-2 text-sm text-slate-200">{descricao}</p>
  </div>
);
