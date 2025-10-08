import { render, screen } from '@testing-library/react';
import { InstanciasPage } from '@/pages/InstanciasPage';

const mutateAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('@/hooks/useInstancias', () => ({
  useInstancias: () => ({
    data: [
      { iwh_id: 1, iwh_nome: 'WhatsApp 1', iwh_status: 'ativo' },
      { iwh_id: 2, iwh_nome: 'WhatsApp 2', iwh_status: 'ativo' },
      { iwh_id: 3, iwh_nome: 'WhatsApp 3', iwh_status: 'ativo' },
    ],
    isLoading: false,
  }),
  useCreateInstancia: () => ({ mutateAsync, isPending: false }),
}));

describe('InstanciasPage', () => {
  beforeEach(() => {\n    process.env.VITE_INSTANCIAS_LIMITE = '3';\n    window.localStorage.setItem('gerencia_usuario', JSON.stringify({ admin: true }));\n  });

  it('desabilita criação ao atingir limite', () => {
    render(<InstanciasPage />);

    const button = screen.getByRole('button', { name: /Limite de instâncias atingido/i });
    expect(button).toBeDisabled();
  });
});

