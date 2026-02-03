import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadDrawer } from '@/features/leads/LeadDrawer';
import type { Lead } from '@/types';

const lead: Lead = {
  led_id: 1,
  led_nome: 'Lead Teste',
  led_email: 'lead@teste.dev',
  led_status: 'negociação',
  led_status_conf: 0.82,
  mensagens: [
    {
      msg_id: 1,
      msg_direcao: 'in',
      msg_conteudo: 'Ol�, podemos negociar?',
      msg_recebido_em: new Date().toISOString(),
    },
  ],
};

describe('LeadDrawer', () => {
  it('mostra conversa e bloco IA quando aberto', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LeadDrawer lead={lead} open onOpenChange={jest.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Lead Teste')).toBeInTheDocument();
    expect(screen.getByText('Ol�, podemos negociar?')).toBeInTheDocument();
    expect(screen.getByText('Sugestoes da IA')).toBeInTheDocument();
  });
});
