import { render, screen, waitFor } from '@testing-library/react';
import * as DashboardModule from '@/features/dashboard/DashboardGestor';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Area: () => <div />,
  Line: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
}));

describe('DashboardGestor', () => {
  it('renderiza layout principal apos carregar dados', async () => {
    const mockData: DashboardModule.DashboardResponse = {
      kpis: {
        totalLeads: 150,
        ganhos: 60,
        perdidos: 30,
        taxaConversao: 66.7,
        valorNegociadoTotal: 350000,
        ticketMedio: 5800,
        tempoMedioPrimeiraRespostaMin: 24,
      },
      serieDiaria: [],
      porStatus: [
        { status: 'Novo', count: 30 },
        { status: 'Qualificando', count: 20 },
        { status: 'Ganho', count: 15 },
        { status: 'Perdido', count: 5 },
        { status: 'Interessado', count: 12 },
        { status: 'Proposta Enviada', count: 10 },
        { status: 'Negociacao', count: 8 },
        { status: 'Follow-up Futuro', count: 6 },
      ],
      objecoes: [
        { tipo: 'Preco', count: 10 },
        { tipo: 'Tempo', count: 6 },
      ],
      funil: [
        { etapa: 'Descoberta', valor: 50 },
        { etapa: 'Fechamento', valor: 20 },
      ],
      metas: {
        metaConversao: 35,
        metaPrimeiraRespostaMin: 25,
      },
      alertas: [
        {
          id: '1',
          lead: 'Lead Teste',
          telefone: '+55 11 90000-0000',
          status: 'Novo',
          motivo: 'Sem resposta ha 12h',
          atrasoMin: 240,
        },
      ],
    };

    const spy = jest.spyOn(DashboardModule, 'fetchDashboard').mockResolvedValue(mockData);

    render(<DashboardModule.default />);

    await waitFor(() => {
      expect(screen.getByText('Visao Geral — GerencIA')).toBeInTheDocument();
      expect(screen.getByText('Leads no periodo')).toBeInTheDocument();
      expect(screen.getByText('Alertas do funil')).toBeInTheDocument();
    });

    spy.mockRestore();
  });
});
