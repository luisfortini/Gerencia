import { render, screen } from '@testing-library/react';
import { LeadDrawer } from '@/features/leads/LeadDrawer';
import type { Lead } from '@/types';

const lead: Lead = {
  led_id: 1,
  led_nome: 'Lead Teste',
  led_email: 'lead@teste.dev',
  led_status: 'negociacao',
  led_status_conf: 0.82,
  mensagens: [
    {
      msg_id: 1,
      msg_direcao: 'in',
      msg_conteudo: 'Olá, podemos negociar?',
      msg_recebido_em: new Date().toISOString(),
    },
  ],
};

describe('LeadDrawer', () => {
  it('mostra conversa e bloco IA quando aberto', () => {
    render(<LeadDrawer lead={lead} open onOpenChange={jest.fn()} />);

    expect(screen.getByText('Lead Teste')).toBeInTheDocument();
    expect(screen.getByText('Olá, podemos negociar?')).toBeInTheDocument();
    expect(screen.getByText('Sugestões da IA')).toBeInTheDocument();
  });
});
