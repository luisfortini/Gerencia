import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ContaResumo, EvolutionConfig } from '@/types';

type ContaPayload = {
  cta_nome: string;
  cta_slug: string;
  cta_plano_tipo: 'mensal' | 'anual';
  cta_limite_instancias: number;
  cta_limite_usuarios: number;
  cta_retencao_dias: number;
  cta_status?: 'ativo' | 'inativo';
  cta_observacoes?: string | null;
};

export const useAdminOverview = () =>
  useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const { data } = await api.get<{ contas: number; usuarios: number; instancias: number; leads: number }>('/admin/overview');
      return data;
    },
  });

export const useAdminContas = () =>
  useQuery({
    queryKey: ['admin-contas'],
    queryFn: async () => {
      const { data } = await api.get<ContaResumo[]>('/admin/contas');
      return data;
    },
  });

export const useEvolutionConfig = () =>
  useQuery({
    queryKey: ['evolution-config'],
    queryFn: async () => {
      const { data } = await api.get<EvolutionConfig>('/admin/settings/evolution');
      return data;
    },
  });

export const useUpdateEvolutionConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { base_url?: string; api_key?: string | null; verify_ssl?: boolean }) => {
      const { data } = await api.put<EvolutionConfig>('/admin/settings/evolution', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-config'] });
    },
  });
};

const invalidateContaQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['admin-contas'] });
  queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
};

export const useCreateConta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ContaPayload) => {
      const { data } = await api.post<ContaResumo>('/admin/contas', payload);
      return data;
    },
    onSuccess: () => {
      invalidateContaQueries(queryClient);
    },
  });
};

export const useUpdateConta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<ContaPayload> }) => {
      const { data } = await api.patch<ContaResumo>(`/admin/contas/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      invalidateContaQueries(queryClient);
    },
  });
};

export const useDeleteConta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/contas/${id}`);
    },
    onSuccess: () => {
      invalidateContaQueries(queryClient);
    },
  });
};
