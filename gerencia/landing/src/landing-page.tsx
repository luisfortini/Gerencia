import { useState } from "react";
import logoFull from "./assets/logo-full.svg";
import logoMark from "./assets/logo-mark.svg";
import dashHero from "./assets/dash01.png";
import dashSolution from "./assets/dash02.png";
import kanbanImage from "./assets/kanban.png";
import listaImage from "./assets/lista.png";

const dorItems = [
  "Vendedor não preenche o CRM",
  "Nenhum controle real sobre os contatos",
  "Não sabe em que etapa cada cliente está",
  "Não tem ideia do valor total que está sendo negociado",
  "Perde oportunidades por falta de acompanhamento",
  "Falta tempo para classificar conversas",
  "Não sabe quais são as objeções dos clientes",
  "Acha CRM complicado de usar e configurar",
  "Acha CRM caro",
  "Depende dos vendedores para saber o que está acontecendo",
];

const solucaoCards = [
  "Configuração fácil — basta conectar o WhatsApp",
  "Visualize conversas direto no CRM",
  "Classificação automática de conversas",
  "Rastreamento automático de valores negociados",
  "Dashboard completo de acompanhamento",
  "Identificação automática de objeções",
  "Acompanhamento de atendentes e vendedores",
];

const beneficios = [
  "Clareza total sobre os atendimentos",
  "Dados reais para decisões inteligentes",
  "Acompanhamento da equipe",
  "Independência da operação",
  "Acompanhamento em tempo real",
  "Entendimento automático das objeções",
];

const planos = [
  {
    nome: "Start",
    whatsapp: "1 número de WhatsApp",
    usuarios: "3 usuários",
    precoMensal: 99,
    precoAnualMensal: 79.9,
    cta: "Quero começar com o Start",
    recursos: [
      "Integração com WhatsApp e dashboards em tempo real",
      "Classificação automática de conversas com IA",
    ],
  },
  {
    nome: "Pro",
    whatsapp: "2 números de WhatsApp",
    usuarios: "5 usuários",
    precoMensal: 179.9,
    precoAnualMensal: 149.9,
    cta: "Quero o plano Pro",
    destaque: true,
    recursos: [
      "Integração multi-fila com dashboards em tempo real",
      "Classificação automática de conversas com IA",
      "Suporte prioritário e onboarding assistido",
    ],
  },
];

const SectionCTA = ({ href, label }: { href: string; label: string }) => (
  <div className="mt-10">
    <a
      href={href}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00C2FF] px-8 py-3 text-center text-sm font-semibold text-[#0C1E3C] transition hover:scale-[1.01] hover:bg-[#29d2ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C2FF] md:w-auto"
    >
      {label}
    </a>
  </div>
);

export const LandingPage = () => {
  const appUrl = import.meta.env.VITE_APP_URL ?? "http://localhost:5175";
  const [billingCycle, setBillingCycle] = useState<"mensal" | "anual">("mensal");
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const economiaMaxima = planos.reduce(
    (max, plano) => Math.max(max, Math.round((1 - plano.precoAnualMensal / plano.precoMensal) * 100)),
    0
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0C1E3C] text-[#E6E6E6]">
      <BackgroundGlow />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#hero" className="flex items-center gap-3">
          <img src={logoFull} alt="GerêncIA" className="hidden h-10 w-auto md:block" />
          <img src={logoMark} alt="GerêncIA" className="h-10 w-auto md:hidden" />
        </a>
        <nav className="hidden items-center gap-6 text-sm text-[#B8D7E6] md:flex">
          <a className="transition hover:text-white" href="#dor">
            É pra mim?
          </a>
          <a className="transition hover:text-white" href="#solucao">
            Solução
          </a>
          <a className="transition hover:text-white" href="#beneficios">
            Benefícios
          </a>
          <a className="transition hover:text-white" href="#diferencial">
            Diferencial
          </a>
          <a className="transition hover:text-white" href="#planos">
            Planos
          </a>
        </nav>
        <a
          className="inline-flex items-center justify-center rounded-full border border-[#00C2FF]/40 px-5 py-2 text-sm font-medium text-[#E6E6E6] transition hover:bg-[#102746]/80"
          href={`${appUrl}/login`}
        >
          Entrar
        </a>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-20 px-6 pb-20 md:gap-24">
        <section id="hero" className="pt-12 md:pt-16">
          <div className="grid gap-12 md:grid-cols-[1.1fr,0.9fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9DB8C6]">
                GerêncIA • O CRM que pensa e age
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
                O CRM que pensa e age
              </h1>
              <p className="mt-6 text-base leading-relaxed text-[#C6E3F2] md:text-lg">
                Conecte o seu WhatsApp e veja o GerêncIA transformar conversas em dados, classificar leads
                automaticamente e revelar onde o seu dinheiro está sendo perdido.
              </p>
              <SectionCTA href="#solucao" label="Quero ver como funciona" />
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-[#00C2FF]/30 bg-[#102746]/80 p-3 shadow-lg shadow-black/30">
              <img
                src={dashHero}
                alt="Tela do dashboard principal do Gerencia"
                className="h-full w-full rounded-2xl object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section id="dor" className="rounded-3xl border border-[#1B335A] bg-[#0E2447]/80 p-8 shadow-lg shadow-black/25 md:p-12">
          <div className="grid gap-10">
            <div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                Você sente que está perdendo vendas, mas não sabe onde?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#C6E3F2]">
                A maioria das empresas não tem clareza sobre o que acontece com seus leads porque o controle depende
                demais do vendedor.
              </p>
              <ul className="mt-8 grid grid-cols-1 gap-4 text-sm text-[#E6E6E6]/90 sm:grid-cols-2">
                {dorItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#00C2FF]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <SectionCTA href="#solucao" label="Quero sair desse cenário" />
            </div>
          </div>
        </section>

        <section id="solucao" className="rounded-3xl border border-[#1B335A] bg-[#102746]/80 p-8 shadow-lg shadow-black/25 md:p-12">
          <div className="grid gap-10 md:grid-cols-[0.9fr,1.1fr] md:items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Um CRM que faz o trabalho sozinho.</h2>
              <p className="mt-4 text-base leading-relaxed text-[#C6E3F2]">
                O GerêncIA elimina a dependência do vendedor. Ele se conecta ao WhatsApp, entende as conversas e
                transforma isso em dados automáticos.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {solucaoCards.map((item) => (
                  <div key={item} className="rounded-2xl border border-[#1F3C68] bg-white/5 p-4 text-sm text-[#E6E6E6]">
                    {item}
                  </div>
                ))}
              </div>
              <SectionCTA href="#beneficios" label="Quero entender os resultados" />
            </div>
            <div className="order-1 md:order-2">
              <div className="relative overflow-hidden rounded-3xl border border-[#00C2FF]/30 bg-[#102746]/80 p-3 shadow-lg shadow-black/30">
                <img
                  src={dashSolution}
                  alt="Integração do WhatsApp e painel do Gerência"
                  className="h-full w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="rounded-3xl border border-[#1B335A] bg-[#0E2447]/80 p-8 shadow-lg shadow-black/25 md:p-12">
          <div className="grid gap-10 md:grid-cols-[1.1fr,0.9fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                Deixe de operar no escuro e comece a decidir com dados.
              </h2>
              <ul className="mt-8 grid grid-cols-1 gap-4 text-sm text-[#E6E6E6]/90 sm:grid-cols-2">
                {beneficios.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#00C2FF]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <SectionCTA href="#planos" label="Quero acompanhar com dados reais" />
            </div>
            <div className="order-1 md:order-2">
              <div className="relative overflow-hidden rounded-3xl border border-[#00C2FF]/30 bg-[#102746]/80 p-3 shadow-lg shadow-black/30">
                <img
                  src={kanbanImage}
                  alt="Quadro kanban do Gerência"
                  className="h-full w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="diferencial" className="rounded-3xl border border-[#1B335A] bg-[#102746]/80 p-8 shadow-lg shadow-black/25 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr,1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                CRMs tradicionais esperam que o vendedor trabalhe. O GerêncIA trabalha no lugar dele.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#C6E3F2]">
                Enquanto outros sistemas dependem de preenchimento manual, o GerêncIA entende o conteúdo das conversas
                e preenche tudo automaticamente.
              </p>
              <SectionCTA href="#planos" label="Quero esse diferencial" />
            </div>
            <div className="order-1 md:order-2">
              <div className="relative overflow-hidden rounded-3xl border border-[#00C2FF]/30 bg-[#102746]/80 p-3 shadow-lg shadow-black/30">
                <img
                  src={listaImage}
                  alt="Comparativo de lista automatizada do Gerência"
                  className="h-full w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="planos" className="rounded-3xl border border-[#1B335A] bg-[#0E2447]/80 p-8 shadow-lg shadow-black/25 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Escolha o plano certo para o seu ritmo de crescimento</h2>
            <p className="mt-3 text-sm text-[#C6E3F2]">
              Todos os planos incluem integração com WhatsApp, classificação automática, rastreamento de valores e dashboard em tempo real.
            </p>
          </div>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center rounded-full bg-[#102746]/80 p-1 text-xs font-semibold text-[#9DB8C6]">
              <button
                type="button"
                onClick={() => setBillingCycle("mensal")}
                className={`rounded-full px-4 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C2FF] ${
                  billingCycle === "mensal" ? "bg-white text-[#0C1E3C] shadow-sm shadow-black/10" : "text-[#9DB8C6] hover:text-white"
                }`}
                aria-pressed={billingCycle === "mensal"}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("anual")}
                className={`rounded-full px-4 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C2FF] ${
                  billingCycle === "anual" ? "bg-white text-[#0C1E3C] shadow-sm shadow-black/10" : "text-[#9DB8C6] hover:text-white"
                }`}
                aria-pressed={billingCycle === "anual"}
              >
                <span className="flex items-center gap-2">
                  Anual
                  <span className="inline-flex items-center rounded-full bg-[#00C2FF]/15 px-2 py-[2px] text-[10px] font-semibold text-[#00C2FF]">
                    Economize até {economiaMaxima}%
                  </span>
                </span>
              </button>
            </div>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {planos.map((plano) => {
              const precoAtual = billingCycle === "mensal" ? plano.precoMensal : plano.precoAnualMensal;
              const precoFormatado = `${formatCurrency(precoAtual)}/mês`;
              const economia = Math.round((1 - plano.precoAnualMensal / plano.precoMensal) * 100);
              const totalAnualFormatado = formatCurrency(plano.precoAnualMensal * 12);
              const descricaoCobranca =
                billingCycle === "mensal"
                  ? "Cobrança mensal, cancele quando quiser."
                  : `${totalAnualFormatado} cobrados uma vez ao ano · Economize ${economia}%`;
              const rotuloCiclo = billingCycle === "mensal" ? "Plano mensal" : "Plano anual";

              return (
                <article
                  key={plano.nome}
                  className={`relative flex h-full flex-col rounded-3xl border bg-[#142E54]/80 p-6 text-left shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:shadow-black/40 ${
                    plano.destaque ? "border-[#00C2FF] ring-2 ring-[#00C2FF]/60" : "border-[#1F3C68]"
                  }`}
                >
                  {plano.destaque ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00C2FF] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#0C1E3C] shadow-md shadow-[#00C2FF]/40">
                      Mais escolhido
                    </span>
                  ) : null}
                  <h3 className="mt-2 text-2xl font-semibold text-white">{plano.nome}</h3>
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-semibold text-white">{precoFormatado}</span>
                      <span className="text-xs uppercase tracking-wide text-[#9DB8C6]">{rotuloCiclo}</span>
                    </div>
                    <p className="text-xs text-[#9DB8C6]">{descricaoCobranca}</p>
                    {billingCycle === "anual" ? (
                      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#00C2FF]/10 px-3 py-1 text-xs font-semibold text-[#00C2FF]">
                        Economize {economia}%
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-[#E6E6E6]/90">
                    <li>{plano.whatsapp}</li>
                    <li>{plano.usuarios}</li>
                    {plano.recursos.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a
                    href={`${appUrl}/login`}
                    className={`mt-auto inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C2FF] ${
                      plano.destaque
                        ? "bg-[#00C2FF] text-[#0C1E3C] hover:bg-[#29d2ff]"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {plano.cta}
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section id="encerramento" className="rounded-3xl border border-[#1B335A] bg-[#102746]/80 p-8 shadow-lg shadow-black/25 md:p-12">
          <div className="grid gap-10">
            <div>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                Quando você enxerga seus dados, você enxerga seu crescimento.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#C6E3F2]">
                O GerêncIA foi criado para empresários que querem controle total sobre seus leads sem depender de
                planilhas ou relatórios manuais.
              </p>
              <SectionCTA href={`${appUrl}/login`} label="Quero conhecer o GerêncIA" />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#1F3C68] bg-[#07152C]/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-xs text-[#9DB8C6] md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} GerêncIA. Todos os direitos reservados.</span>
          <div className="flex flex-wrap gap-4">
            <a className="transition hover:text-white" href="#hero">
              Voltar ao topo
            </a>
            <a className="transition hover:text-white" href="mailto:contato@crmgerencia.com.br">
              contato@crmgerencia.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const BackgroundGlow = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0">
    <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#00C2FF]/20 blur-[160px]" />
    <div className="absolute bottom-[-200px] right-[-120px] h-[380px] w-[380px] rounded-full bg-[#00C2FF]/15 blur-[160px]" />
    <div className="absolute bottom-[-240px] left-[-120px] h-[360px] w-[360px] rounded-full bg-[#4D6C8C]/25 blur-[160px]" />
  </div>
);













