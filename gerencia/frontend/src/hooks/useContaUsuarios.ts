import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UsuarioOption } from '@/types';

export const useContaUsuarios = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['conta-usuários'],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<UsuarioOption[]>('/usuários/opções');
      return data;
    },
  });

