import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Lead, LeadStatus, Paginated } from '@/types';

export const useKanbanLeads = () =>
  useQuery({
    queryKey: ['leads-kanban'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Lead>>('/leads', {
        params: {
          per_page: 200,
        },
      });

      const columns: Record<LeadStatus, Lead[]> = {
        novo: [],
        qualificado: [],
        interessado: [],
        negociacao: [],
        follow_up: [],
        ganho: [],
        perdido: [],
      };

      data.data.forEach((lead) => {
        const status = lead.led_status as LeadStatus;
        if (columns[status]) {
          columns[status].push(lead);
        } else {
          columns.novo.push(lead);
        }
      });

      return columns;
    },
  });
