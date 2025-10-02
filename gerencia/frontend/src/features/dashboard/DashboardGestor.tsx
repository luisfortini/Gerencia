import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Users,
  CheckCircle2,
  XCircle,
  Receipt,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Info,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';

export type DashboardPeriod = '7d' | '30d' | '90d';
export type DashboardWhatsapp = 'all' | string;

type SeriePoint = {
  dia: string;
  novos: number;
  ganhos: number;
  perdidos: number;
};

type FunilPoint = {
  etapa: string;
  valor: number;
};

type ObjecaoPoint = {
  tipo: string;
  count: number;
};

type MetaInfo = {
  metaConversao: number;
  metaPrimeiraRespostaMin: number;
};

type DashboardAlert = {
  id: string;
  lead: string;
  telefone: string;
  status: string;
  motivo: string;
  atrasoMin: number;
};

export type DashboardResponse = {
  kpis: {
    totalLeads: number;
    leadsNoPeriodo: number;
    ganhos: number;
    perdidos: number;
    taxaConversao: number;
    valorNegociadoTotal: number;
    ticketMedio: number;
    tempoMedioPrimeiraRespostaMin: number | null;
  };
  serieDiaria: SeriePoint[];
  porStatus: Array<{ status: string; count: number }>;
  objecoes: ObjecaoPoint[];
  funil: FunilPoint[];
  metas: MetaInfo;
  alertas: DashboardAlert[];
};

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  Novo: { badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  Qualificando: { badge: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  Interessado: { badge: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  'Proposta Enviada': { badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  Negociacao: { badge: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  Ganho: { badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  Perdido: { badge: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
  'Follow-up Futuro': { badge: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500' },
};

const WHATSAPP_OPTIONS: Array<{ value: DashboardWhatsapp; label: string }> = [
  { value: 'all', label: 'Todas as instancias' },
];

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: '7d', label: 'Ultimos 7 dias' },
  { value: '30d', label: 'Ultimos 30 dias' },
  { value: '90d', label: 'Ultimos 90 dias' },
];

export const fetchDashboard = async (params: {
  period: DashboardPeriod;
  whatsapp: DashboardWhatsapp;
  search: string;
}): Promise<DashboardResponse> => {
  const { data } = await api.get<DashboardResponse>('/dashboard', {
    params: {
      period: params.period,
      whatsapp: params.whatsapp,
      search: params.search,
    },
  });

  return data;
};

const formatNumber = (value: number) => value.toLocaleString('pt-BR');
const formatCurrency = (value: number) =>
  value
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: value >= 100000 ? 0 : 2,
    })
    .replace('R$', 'R$ ');

const getStatusStyles = (status: string) =>
  STATUS_STYLES[status] ?? {
    badge: 'bg-slate-100 text-slate-700',
    dot: 'bg-slate-400',
  };

const DashboardGestor = () => {
  const [period, setPeriod] = useState<DashboardPeriod>('7d');
  const [whatsapp, setWhatsapp] = useState<DashboardWhatsapp>('all');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (options = { period, whatsapp, search }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchDashboard(options);
      setData(response);
    } catch (err) {
      console.error(err);
      setError('Falha ao carregar dados do dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, whatsapp]);

  const kpiCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        icon: Users,
        label: 'Leads no periodo',
        value: data.kpis.leadsNoPeriodo,
        hint: `Total monitorado: ${formatNumber(data.kpis.totalLeads)}`,
        trendIcon: TrendingUp,
      },
      {
        icon: CheckCircle2,
        label: 'Ganhos',
        value: data.kpis.ganhos,
        hint: `Conversao ${data.kpis.taxaConversao.toFixed(1)}%`,
        trendIcon: TrendingUp,
      },
      {
        icon: XCircle,
        label: 'Perdidos',
        value: data.kpis.perdidos,
        hint: 'Leads marcados como perdidos.',
        trendIcon: TrendingDown,
      },
      {
        icon: Receipt,
        label: 'Valor negociado',
        value: data.kpis.valorNegociadoTotal,
        hint: `Ticket medio ${formatCurrency(data.kpis.ticketMedio)}`,
        isCurrency: true,
        trendIcon: Info,
      },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Visao Geral — GerencIA</h1>
          <p className="text-sm text-gray-500">
            Panorama consolidado da performance comercial com dados assistidos por IA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-slate-400" />
          <span className="text-xs text-slate-500">Dados atualizados direto do endpoint /api/dashboard.</span>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-white p-4 shadow-sm md:grid-cols-[repeat(4,minmax(0,1fr))]">
        <Select value={period} onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}>
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)}>
          {WHATSAPP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            void loadData({ period, whatsapp, search });
          }}
          disabled={isLoading}
          className="flex items-center justify-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" /> Erro ao buscar dados
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void loadData()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading && !data
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse border-dashed">
                <div className="h-24" />
              </Card>
            ))
          : kpiCards.map((item) => {
              const Icon = item.icon;
              const TrendIcon = item.trendIcon;
              return (
                <Card key={item.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Icon className="h-4 w-4 text-primary" />
                      {item.label}
                    </span>
                    <TrendIcon className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-3xl font-semibold text-slate-900">
                      {item.isCurrency
                        ? formatCurrency(item.value)
                        : formatNumber(item.value ?? 0)}
                    </p>
                    <p className="text-xs text-slate-500">{item.hint}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Evolucao diaria</CardTitle>
            <CardDescription>Volume de novos leads, ganhos e perdidos por dia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <AreaChart data={data?.serieDiaria ?? []}>
                  <defs>
                    <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dia" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ stroke: '#cbd5f5', strokeWidth: 1 }} />
                  <Legend />
                  <Area type="monotone" dataKey="novos" name="Novos" stroke="#38bdf8" fill="url(#colorNovos)" />
                  <Line type="monotone" dataKey="ganhos" name="Ganhos" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="perdidos" name="Perdidos" stroke="#f97316" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500">
              Visualize o ritmo diario de novos contatos e o desfecho de cada negociacao.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> SLA primeira resposta
            </CardTitle>
            <CardDescription>Tempo medio versus meta definida para o time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-4xl font-semibold text-slate-900">
                {data?.kpis.tempoMedioPrimeiraRespostaMin !== undefined && data?.kpis.tempoMedioPrimeiraRespostaMin !== null
                  ? `${data.kpis.tempoMedioPrimeiraRespostaMin} min`
                  : '--'}
              </p>
              <p className="text-sm text-slate-500">
                Meta: {data ? `${data.metas.metaPrimeiraRespostaMin} min` : '--'}
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  data && data.kpis.tempoMedioPrimeiraRespostaMin !== null &&
                  data.kpis.tempoMedioPrimeiraRespostaMin <= data.metas.metaPrimeiraRespostaMin
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (data?.kpis.tempoMedioPrimeiraRespostaMin ?? data?.metas.metaPrimeiraRespostaMin ?? 0) * 1.8
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Acompanhe o tempo de resposta desde o primeiro contato ate a primeira interacao do time.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Funil de vendas</CardTitle>
            <CardDescription>Etapas com volume agregado de leads.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer>
                <BarChart data={data?.funil ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="etapa" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="valor" name="Leads" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500">Utilize para identificar gargalos entre cada etapa do funil.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuicao por status</CardTitle>
            <CardDescription>Status atuais dos leads monitorados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              {(data?.porStatus ?? []).map((item) => {
                const styles = getStatusStyles(item.status);
                return (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                      <span className="text-sm font-medium text-slate-700">{item.status}</span>
                    </div>
                    <Badge className={styles.badge}>{formatNumber(item.count)}</Badge>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">Status definidos automaticamente pela IA ou pelo time comercial.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top objecoes</CardTitle>
            <CardDescription>Principais impeditivos identificados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <RechartsTooltip />
                  <Pie
                    data={data?.objecoes ?? []}
                    dataKey="count"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={4}
                    label
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500">Oriente campanhas de follow-up focando nas objecoes frequentes.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" /> Alertas do funil
          </CardTitle>
          <CardDescription>Leads que exigem acao imediata para evitar perda de oportunidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Lead</TableHeaderCell>
                <TableHeaderCell>Telefone</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Motivo</TableHeaderCell>
                <TableHeaderCell>Atraso</TableHeaderCell>
                <TableHeaderCell>Acoes</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.alertas ?? []).map((alerta) => {
                const styles = getStatusStyles(alerta.status);
                return (
                  <TableRow key={alerta.id}>
                    <TableCell className="font-medium text-slate-900">{alerta.lead}</TableCell>
                    <TableCell>{alerta.telefone}</TableCell>
                    <TableCell>
                      <Badge className={styles.badge}>{alerta.status}</Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-2 text-sm text-slate-700">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      {alerta.motivo}
                    </TableCell>
                    <TableCell>{Math.max(1, Math.round(alerta.atrasoMin / 60))} h</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          Ver conversa
                        </Button>
                        <Button variant="outline" size="sm">
                          Atribuir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data && data.alertas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-slate-500">
                    Nenhum alerta de funil no periodo selecionado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-slate-500">
            Atue nos alertas para garantir que nenhum lead extrapole os limites de SLA combinados.
          </p>
        </CardContent>
      </Card>

      <footer className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-400">
        Dados provenientes do endpoint /api/dashboard. Ajuste filtros para refinar as metricas.
      </footer>
    </div>
  );
};

export default DashboardGestor;
