# GerencIA

GerencIA é um CRM SaaS focado em equipes que dependem do WhatsApp. A plataforma usa IA para ler mensagens recebidas via Evolution API, extrair informações relevantes e manter o status dos leads sempre atualizado.

## Estrutura do repositório

```
gerencia/
├── backend/    # Laravel 10 (API + multi-tenant + jobs IA)
├── frontend/   # Vite + React + Tailwind + shadcn-like UI
├── landing/    # Landing page React de página única
├── infra/      # Scripts utilitários e cron jobs
├── .env.example
├── .gitignore
└── README.md
```

## Pré-requisitos
- PHP 8.2+
- Composer
- MySQL 8+
- Node.js 18+
- npm ou yarn

## Passo a passo rápido

1. Clone o projeto e entre na pasta `gerencia`.
2. Execute `bash infra/setup_local.sh` (ou rode manualmente os passos abaixo):
   - `composer install`
   - `cp backend/.env.example backend/.env`
   - Configure o banco no `.env` e rode `php artisan migrate --seed`
   - `npm install` em `frontend/` e `landing/`
3. Suba a API: `php artisan serve` (porta padrão 8000).
4. Rode a fila quando quiser processar IA: `php artisan queue:work`.
5. Dispare o front-end: `npm run dev` dentro de `frontend/`.
6. Landing opcional: `npm run dev` em `landing/` (export estático com `npm run build`).

## Configuração do backend

- Autenticação via Laravel Sanctum com escopo multi-tenant (middleware `ResolveTenant`).
- Integração com Evolution API por webhook (`POST /api/webhook/evolution`).
- Jobs de IA com fallback (Mock + OpenAI) em `App\Jobs\ProcessIaJob`.
- Comandos artisan principais:
  - `php artisan jobs:process-ia`
  - `php artisan retencao:purge`
- Testes: `php artisan test` (verifica deduplicação de mensagens, regras de status, tenant, retenção).

## Front-end (app)

- React + Vite + Tailwind. Componentes UI inspirados no shadcn/ui.
- Páginas: Dashboard, Leads (lista/drawer), Kanban, Instâncias WhatsApp, Admin Global.
- Estado remoto via React Query e axios (`frontend/src/lib/api.ts`).
- Testes (Jest + Testing Library): `npm test` dentro de `frontend/`.

## Landing

- Página única em React (`landing/src/landing-page.tsx`) com toggle de plano e CTA para `/app/signup`.
- Build estático: `npm run build` dentro de `landing/`.

## Cron sugerido

Adicione o conteúdo de `infra/cron.txt` ao crontab do servidor para executar o scheduler do Laravel a cada minuto.

```
* * * * * php artisan schedule:run
```

## Variáveis de ambiente principais

As variáveis mínimas estão em `.env.example`. Configure especialmente `DB_*`, `OPENAI_API_KEY` e `IA_TIER`.

---
Com isso a GerencIA estará pronta para automatizar o seu funil de vendas no WhatsApp.
