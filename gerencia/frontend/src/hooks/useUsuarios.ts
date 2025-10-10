import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Usuario, UsuariosResponse } from '@/types';

export type UsuarioCreatePayload = {
  usr_nome: string;
  usr_email: string;
  usr_senha: string;
  usr_papel: 'gestor' | 'operador';
  usr_admin?: boolean;
  usr_ativo?: boolean;
};

export type UsuarioUpdatePayload = Partial<Omit<UsuarioCreatePayload, 'usr_senha'>> & {
  usr_senha?: string;
  usr_ativo?: boolean;
};

export const useUsuarios = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data } = await api.get<UsuariosResponse>('/usuarios');
      return data;
    },
    enabled: options?.enabled ?? true,
  });

export const useCreateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UsuarioCreatePayload) => {
      const { data } = await api.post<Usuario>('/usuarios', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UsuarioUpdatePayload }) => {
      const { data } = await api.patch<Usuario>(`/usuarios/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useDeleteUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};
