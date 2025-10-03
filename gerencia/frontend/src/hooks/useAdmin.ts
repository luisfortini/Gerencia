import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ContaResumo, EvolutionConfig } from '@/types';

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