import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardSettings, EvolutionQrCode, InstanciaWhatsapp } from "@/types";

type EvolutionConnectResponse = {
  instance?: {
    instanceName?: string;
    status?: string;
    state?: string;
  };
  qrcode?: EvolutionQrCode;
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
};

type InstanciaPayload = {
  iwh_nome: string;
  numero?: string;
  numero_internacional?: boolean;
};

export const useInstancias = () =>
  useQuery({
    queryKey: ["instancias"],
    queryFn: async () => {
      const { data } = await api.get<InstanciaWhatsapp[] | Record<string, unknown>>("/instancias");
      return Array.isArray(data) ? data : [];
    },
  });

export const useCreateInstancia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InstanciaPayload) => {
      const { data } = await api.post<InstanciaWhatsapp>("/instancias", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instancias"] });
    },
  });
};

export const useConnectInstancia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<EvolutionConnectResponse>(`/instancias/${id}/connect`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instancias"] });
    },
  });
};

export const useSyncInstanciaWebhook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/instancias/${id}/webhook/sync`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instancias"] });
    },
  });
};

export const useRefreshInstancia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/instancias/${id}/refresh`);
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["instancias"] });
    },
  });
};

export const useDeleteInstancia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/instancias/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instancias"] });
    },
  });
};

type RawDashboardSettings = {
  meta_primeira_resposta_min: number;
  default_meta_primeira_resposta_min: number;
};

const normalizeDashboardSettings = (data: RawDashboardSettings): DashboardSettings => ({
  metaPrimeiraRespostaMin: data.meta_primeira_resposta_min,
  defaultMetaPrimeiraRespostaMin: data.default_meta_primeira_resposta_min,
});

export const useDashboardSettings = () =>
  useQuery({
    queryKey: ["dashboard-settings"],
    queryFn: async () => {
      const { data } = await api.get<RawDashboardSettings>("/settings/dashboard");
      return normalizeDashboardSettings(data);
    },
  });

export const useUpdateDashboardSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { metaPrimeiraRespostaMin: number }) => {
      const { data } = await api.put<RawDashboardSettings>("/settings/dashboard", {
        meta_primeira_resposta_min: payload.metaPrimeiraRespostaMin,
      });

      return normalizeDashboardSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-settings"] });
    },
  });
};
