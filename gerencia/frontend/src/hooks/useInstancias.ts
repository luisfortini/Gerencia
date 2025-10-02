import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InstanciaWhatsapp } from '@/types';

export const useInstancias = () =>
  useQuery({
    queryKey: ['instancias'],
    queryFn: async () => {
      const { data } = await api.get<InstanciaWhatsapp[]>('/instancias');
      return data;
    },
  });

export const useCreateInstancia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { iwh_nome: string; iwh_api_key: string; iwh_webhook_token: string }) => {
      const { data } = await api.post<InstanciaWhatsapp>('/instancias', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instancias'] });
    },
  });
};
