import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Lead, Paginated } from '@/types';

interface LeadsFilters {
  search?: string;
  status?: string;
  page?: number;
}

export const useLeads = (filters: LeadsFilters) =>
  useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Lead>>('/leads', {
        params: {
          search: filters.search,
          status: filters.status,
          page: filters.page ?? 1,
        },
      });
      return data;
    },
  });
