import { fireEvent, render, screen } from '@testing-library/react';
import { KanbanBoard } from '@/features/kanban/KanbanBoard';
import type { Lead, LeadStatus } from '@/types';

const lead: Lead = {
  led_id: 42,
  led_nome: 'Cliente Teste',
  led_status: 'negociacao',
  led_status_conf: 0.88,
};

const columns: Record<LeadStatus, Lead[]> = {
  novo: [],
  qualificado: [],
  interessado: [],
  negociacao: [lead],
  follow_up: [],
  ganho: [],
  perdido: [],
};

describe('KanbanBoard', () => {
  it('abre modal de ganho ao acionar ação manual', () => {
    const onChangeStatus = jest.fn().mockResolvedValue(undefined);

    render(<KanbanBoard columns={columns} onChangeStatus={onChangeStatus} onOpenLead={jest.fn()} />);

    fireEvent.click(screen.getByText('Marcar como ganho'));

    expect(screen.getByText('Registrar lead como ganho')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: 1999.90')).toBeInTheDocument();
  });
});

