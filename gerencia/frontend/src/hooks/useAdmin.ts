import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ContaResumo } from '@/types';

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
