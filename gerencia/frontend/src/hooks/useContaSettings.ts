import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EmpresaSettings } from '@/types';

type RawEmpresaSettings = {
  empresa_sobre: string;
  empresa_produtos: string;
};

const normalizeEmpresaSettings = (data: RawEmpresaSettings): EmpresaSettings => ({
  empresaSobre: data.empresa_sobre ?? '',
  empresaProdutos: data.empresa_produtos ?? '',
});

export const useEmpresaSettings = () =>
  useQuery({
    queryKey: ['empresa-settings'],
    queryFn: async () => {
      const { data } = await api.get<RawEmpresaSettings>('/settings/empresa');
      return normalizeEmpresaSettings(data);
    },
  });

export const useUpdateEmpresaSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EmpresaSettings) => {
      const { data } = await api.put<RawEmpresaSettings>('/settings/empresa', {
        empresa_sobre: payload.empresaSobre,
        empresa_produtos: payload.empresaProdutos,
      });
      return normalizeEmpresaSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa-settings'] });
    },
  });
};
