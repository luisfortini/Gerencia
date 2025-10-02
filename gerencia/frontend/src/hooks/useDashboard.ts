import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardMetrics } from '@/types';

export const useDashboard = () =>
  useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data } = await api.get<DashboardMetrics>('/dashboard');
      return data;
    },
  });
