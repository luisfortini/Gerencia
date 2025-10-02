import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Lead } from '@/types';

export const useLeadDetails = (leadId: number | null) =>
  useQuery({
    queryKey: ['lead', leadId],
    enabled: Boolean(leadId),
    queryFn: async () => {
      const { data } = await api.get<Lead>(`/leads/${leadId}`);
      return data;
    },
  });
