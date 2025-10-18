import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Lead } from '@/types';

export const useLeadAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, responsavelId }: { leadId: number; responsavelId: number | null }) => {
      const { data } = await api.patch<Lead>(`/leads/${leadId}`, {
        led_responsavel_usrid: responsavelId,
      });
      return data;
    },
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: ['lead', lead.led_id] });
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'leads',
      });
      queryClient.invalidateQueries({ queryKey: ['leads-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['conta-usuários'] });
    },
  });
};
