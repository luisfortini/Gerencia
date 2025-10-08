import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  useConnectInstancia,
  useCreateInstancia,
  useDeleteInstancia,
  useInstancias,
  useRefreshInstancia,
  useSyncInstanciaWebhook,
} from "@/hooks/useInstancias";
import type { EvolutionQrCode, InstanciaWhatsapp } from "@/types";
import { Loader2, Plus } from "lucide-react";

type FeedbackEntry = {
  type: "success" | "error";
  message: string;
};

type FeedbackState = Record<number, FeedbackEntry | undefined>;

type QrCodeState = Record<number, EvolutionQrCode | undefined>;

type ModalStage = "form" | "connecting" | "connected" | "error";

const envLimite =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_INSTANCIAS_LIMITE) ||
  (typeof process !== "undefined" ? process.env?.VITE_INSTANCIAS_LIMITE : undefined);
const INSTANCIA_LIMITE = Number(envLimite ?? 3);

const sanitizeBase64 = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("data:image")) {
    const parts = value.split(",", 2);
    return parts[1] || undefined;
  }

  return value;
};

const extractQr = (payload: unknown): EvolutionQrCode | undefined => {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  if ("qrcode" in payload && (payload as any).qrcode) {
    const qr = (payload as any).qrcode as EvolutionQrCode;
    return {
      ...qr,
      base64: sanitizeBase64(qr.base64),
    };
  }

  const base64 =
    typeof (payload as any).base64 === "string" ? sanitizeBase64((payload as any).base64) : undefined;
  const code = typeof (payload as any).code === "string" ? (payload as any).code : undefined;
  const pairingCode =
    typeof (payload as any).pairingCode === "string" ? (payload as any).pairingCode : undefined;
  const count = typeof (payload as any).count === "number" ? (payload as any).count : undefined;

  if (!base64 && !code && !pairingCode && typeof count === "undefined") {
    return undefined;
  }

  return { base64, code, pairingCode, count };
};

const buildQrImageSrc = (qr: EvolutionQrCode | undefined): string | undefined => {
  const base64 = sanitizeBase64(qr?.base64);
  if (!base64) {
    return undefined;
  }

  return `data:image/png;base64,${base64}`;
};

const formatLocalNumberInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  const ddd = digits.slice(0, 2);
  const subscriber = digits.slice(2);

  if (subscriber.length <= 4) {
    return `(${ddd}) ${subscriber}`;
  }

  const prefix = subscriber.slice(0, subscriber.length - 4);
  const suffix = subscriber.slice(-4);

  return `(${ddd}) ${prefix}-${suffix}`;
};

const normalizePhoneValue = (value: string, international: boolean): string | undefined => {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }

  const normalized = digits.replace(/^0+/, "");
  if (!normalized) {
    return undefined;
  }

  if (international) {
    return normalized.replace(/^00/, "");
  }

  if (normalized.startsWith("55")) {
    return normalized;
  }

  return `55${normalized}`;
};

const formatPhoneForDisplay = (phone?: string, international?: boolean): string | undefined => {
  if (!phone) {
    return undefined;
  }

  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }

  if (international) {
    return `+${digits}`;
  }

  const trimmed = digits.startsWith("55") ? digits.slice(2) : digits;

  if (trimmed.length <= 2) {
    return trimmed;
  }

  const ddd = trimmed.slice(0, 2);
  const subscriber = trimmed.slice(2);

  if (!subscriber) {
    return `(${ddd})`;
  }

  if (subscriber.length <= 4) {
    return `(${ddd}) ${subscriber}`;
  }

  const prefix = subscriber.slice(0, subscriber.length - 4);
  const suffix = subscriber.slice(-4);

  return `(${ddd}) ${prefix}-${suffix}`;
};

const getInstanciaStatus = (instancia: InstanciaWhatsapp): string =>
  (instancia.iwh_metadata?.evolution?.status ?? instancia.iwh_status ?? "").toLowerCase();

const getStatusLabel = (
  instancia: InstanciaWhatsapp,
): { label: string; variant: "success" | "warning" | "destructive" | "outline" } => {
  const status = getInstanciaStatus(instancia);

  if (status === "open") {
    return { label: "Conectado", variant: "success" };
  }

  if (status === "connecting" || status === "conectando") {
    return { label: "Conectando", variant: "warning" };
  }

  if (status === "closed" || status === "desconectado" || status === "disconnected") {
    return { label: "Desconectado", variant: "outline" };
  }

  if (!status) {
    return { label: "Sem status", variant: "outline" };
  }

  return { label: status, variant: "outline" };
};

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as any).response?.data;
    return data?.message ?? data?.details ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const InstanciasPage = () => {
  const { data: instanciasData = [], isLoading } = useInstancias();
  const listaInstancias = Array.isArray(instanciasData) ? instanciasData : [];
  const isLimitReached = listaInstancias.length >= INSTANCIA_LIMITE;

  const createInstancia = useCreateInstancia();
  const connectInstancia = useConnectInstancia();
  const syncInstancia = useSyncInstanciaWebhook();
  const refreshInstancia = useRefreshInstancia();
  const deleteInstancia = useDeleteInstancia();

  const { mutateAsync: createInstanciaAsync, isPending: isCreatePending } = createInstancia;
  const { mutateAsync: connectInstanciaAsync, isPending: isConnectPending } = connectInstancia;
  const { mutateAsync: syncInstanciaAsync, isPending: isSyncPending } = syncInstancia;
  const { mutateAsync: refreshInstanciaAsync, isPending: isRefreshPending } = refreshInstancia;
  const { mutateAsync: deleteInstanciaAsync, isPending: isDeletePending } = deleteInstancia;

  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [numeroInternacional, setNumeroInternacional] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackState>({});
  const [qrCodes, setQrCodes] = useState<QrCodeState>({});

  const [connectingId, setConnectingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pollingId, setPollingId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<ModalStage>("form");
  const [modalInstance, setModalInstance] = useState<InstanciaWhatsapp | null>(null);
  const [modalQr, setModalQr] = useState<EvolutionQrCode | undefined>(undefined);
  const { isSuperAdmin, isAdmin } = useMemo(() => {
    if (typeof window === "undefined") {
      return { isSuperAdmin: false, isAdmin: false } as const;
    }

    const raw = localStorage.getItem("gerencia_usuario");
    if (!raw) {
      return { isSuperAdmin: false, isAdmin: false } as const;
    }

    try {
      const parsed = JSON.parse(raw) as { superadmin?: boolean; admin?: boolean } | null;
      const superFlag = parsed?.superadmin === true;
      return { isSuperAdmin: superFlag, isAdmin: superFlag || parsed?.admin === true } as const;
    } catch (error) {
      console.warn("Nao foi possivel interpretar os dados do usuario salvos localmente.", error);
      return { isSuperAdmin: false, isAdmin: false } as const;
    }
  }, []);

  const canManageInstancias = isSuperAdmin || isAdmin;
  const [modalError, setModalError] = useState<string | null>(null);

  const openModal = () => {
    if (!canManageInstancias) {
      window.alert("Somente administradores podem cadastrar instancias.");
      return;
    }

    setIsModalOpen(true);
    setModalStage("form");
    setModalInstance(null);
    setModalQr(undefined);
    setModalError(null);
    setNome("");
    setNumero("");
    setNumeroInternacional(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStage("form");
    setModalInstance(null);
    setModalQr(undefined);
    setModalError(null);

    if (modalInstance && pollingId === modalInstance.iwh_id) {
      setPollingId(null);
    }
  };

  const handleNumeroChange = (value: string) => {
    setNumero(numeroInternacional ? value.replace(/[^\d+]/g, "") : formatLocalNumberInput(value));
  };

  const handleNumeroInternacionalToggle = (checked: boolean) => {
    setNumeroInternacional(checked);
    setNumero((prev) =>
      checked ? prev.replace(/[^\d+]/g, "") : formatLocalNumberInput(prev),
    );
  };

  const fetchAndApplyQr = async (
    instancia: InstanciaWhatsapp,
    options: { updateModal?: boolean } = {},
  ) => {
    if (!canManageInstancias) {
      window.alert("Somente administradores podem executar esta acao.");
      return;
    }

    const { updateModal = false } = options;

    setConnectingId(instancia.iwh_id);
    setFeedback((prev) => ({ ...prev, [instancia.iwh_id]: undefined }));

    if (updateModal) {
      setModalStage("connecting");
      setModalError(null);
      setModalQr(undefined);
    }

    try {
      const payload = await connectInstanciaAsync(instancia.iwh_id);
      const qr = extractQr(payload as Record<string, unknown>);

      if (qr) {
        setQrCodes((prev) => ({ ...prev, [instancia.iwh_id]: qr }));

        if (updateModal || modalInstance?.iwh_id === instancia.iwh_id) {
          setModalQr(qr);
        }

        setFeedback((prev) => ({
          ...prev,
          [instancia.iwh_id]: {
            type: "success",
            message: "QRCode atualizado. Escaneie pelo WhatsApp.",
          },
        }));

        setPollingId(instancia.iwh_id);
      } else {
        const message = "Evolution nao retornou um QRCode.";
        setFeedback((prev) => ({
          ...prev,
          [instancia.iwh_id]: { type: "error", message },
        }));

        if (updateModal) {
          setModalError(message);
          setModalStage("error");
        }
      }
    } catch (error) {
      const message = resolveErrorMessage(error, "Nao foi possivel gerar o QRCode.");
      setFeedback((prev) => ({
        ...prev,
        [instancia.iwh_id]: { type: "error", message },
      }));

      if (updateModal) {
        setModalError(message);
        setModalStage("error");
      }
    } finally {
      setConnectingId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canManageInstancias) {
      window.alert("Somente administradores podem cadastrar instancias.");
      return;
    }

    if (isCreatePending) {
      return;
    }

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      return;
    }

    setModalStage("connecting");
    setModalError(null);

    try {
      const normalizedPhone = normalizePhoneValue(numero, numeroInternacional);
      const instancia = await createInstanciaAsync({
        iwh_nome: nomeLimpo,
        numero: normalizedPhone,
        numero_internacional: numeroInternacional || undefined,
      });

      setModalInstance(instancia);
      setModalQr(undefined);

      await fetchAndApplyQr(instancia, { updateModal: true });
    } catch (error) {
      const message = resolveErrorMessage(error, "Nao foi possivel criar a instancia.");
      setModalError(message);
      setModalStage("error");
    }
  };

  const handleSyncWebhook = async (instancia: InstanciaWhatsapp) => {
    if (!canManageInstancias) {
      window.alert("Somente administradores podem executar esta acao.");
      return;
    }

    setSyncingId(instancia.iwh_id);
    setFeedback((prev) => ({ ...prev, [instancia.iwh_id]: undefined }));

    try {
      await syncInstanciaAsync(instancia.iwh_id);
      setFeedback((prev) => ({
        ...prev,
        [instancia.iwh_id]: { type: "success", message: "Webhook sincronizado com sucesso." },
      }));
    } catch (error) {
      const message = resolveErrorMessage(error, "Nao foi possivel sincronizar o webhook.");
      setFeedback((prev) => ({
        ...prev,
        [instancia.iwh_id]: { type: "error", message },
      }));
    } finally {
      setSyncingId(null);
    }
  };

  const handleRefreshStatus = async (instancia: InstanciaWhatsapp) => {
    if (!canManageInstancias) {
      window.alert("Somente administradores podem executar esta acao.");
      return;
    }

    setRefreshingId(instancia.iwh_id);
    setFeedback((prev) => ({ ...prev, [instancia.iwh_id]: undefined }));

    try {
      await refreshInstanciaAsync(instancia.iwh_id);
      setFeedback((prev) => ({
        ...prev,
        [instancia.iwh_id]: { type: "success", message: "Status atualizado." },
      }));
    } catch (error) {
      const message = resolveErrorMessage(error, "Nao foi possivel atualizar o status.");
      setFeedback((prev) => ({
        ...prev,
        [instancia.iwh_id]: { type: "error", message },
      }));
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDeleteInstancia = async (instancia: InstanciaWhatsapp) => {
    if (!canManageInstancias) {
      window.alert("Somente administradores podem executar esta acao.");
      return;
    }

    const confirmed = window.confirm(
      `Excluir a instancia "${instancia.iwh_nome}"? Essa acao remove o vinculo local e nao pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(instancia.iwh_id);
    setFeedback((prev) => ({ ...prev, [instancia.iwh_id]: undefined }));

    try {
      await deleteInstanciaAsync(instancia.iwh_id);

      setQrCodes((prev) => {
        if (!(instancia.iwh_id in prev)) {
          return prev;
        }

        const next = { ...prev };
        delete next[instancia.iwh_id];
        return next;
      });

      if (pollingId === instancia.iwh_id) {
        setPollingId(null);
      }

      if (modalInstance?.iwh_id === instancia.iwh_id) {
        closeModal();
      }
    } catch (error) {
      const message = resolveErrorMessage(error, "Nao foi possivel excluir a instancia.");
      setFeedback((prev) => ({
        ...prev,
        [instancia.iwh_id]: { type: "error", message },
      }));
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    setQrCodes((prev) => {
      let changed = false;
      const next = { ...prev };

      listaInstancias.forEach((instancia) => {
        if (getInstanciaStatus(instancia) === "open" && next[instancia.iwh_id]) {
          delete next[instancia.iwh_id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [listaInstancias]);

  useEffect(() => {
    if (pollingId === null) {
      return;
    }

    const target = listaInstancias.find((instancia) => instancia.iwh_id === pollingId);
    if (!target) {
      setPollingId(null);
      return;
    }

    if (getInstanciaStatus(target) === "open") {
      setPollingId(null);
      return;
    }

    const interval = setInterval(() => {
      const current = listaInstancias.find((instancia) => instancia.iwh_id === pollingId);
      if (!current) {
        setPollingId(null);
        return;
      }

      if (getInstanciaStatus(current) === "open") {
        setPollingId(null);
        return;
      }

      if (!isConnectPending) {
        connectInstanciaAsync(pollingId)
          .then((payload) => {
            const qr = extractQr(payload as Record<string, unknown>);
            if (qr) {
              setQrCodes((prev) => ({ ...prev, [pollingId]: qr }));
              if (modalInstance?.iwh_id === pollingId) {
                setModalQr(qr);
              }
            }
          })
          .catch(() => undefined);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [pollingId, listaInstancias, isConnectPending, connectInstanciaAsync, modalInstance?.iwh_id]);

  useEffect(() => {
    if (!modalInstance) {
      return;
    }

    const latest = listaInstancias.find((item) => item.iwh_id === modalInstance.iwh_id);
    if (!latest) {
      return;
    }

    if (modalInstance !== latest) {
      setModalInstance(latest);
    }

    if (getInstanciaStatus(latest) === "open") {
      setModalStage("connected");
      setModalQr(undefined);
      if (pollingId === latest.iwh_id) {
        setPollingId(null);
      }
    }
  }, [listaInstancias, modalInstance?.iwh_id, pollingId]);

  const renderModalContent = () => {
    if (modalStage === "form") {
      return (
        <form id="instancia-create-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-subtle" htmlFor="instancia-nome">
              Nome da instancia
            </label>
            <Input
              id="instancia-nome"
              required
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Minha instancia"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-subtle" htmlFor="instancia-numero">
              Numero do WhatsApp
            </label>
            <Input
              id="instancia-numero"
              value={numero}
              onChange={(event) => handleNumeroChange(event.target.value)}
              placeholder={numeroInternacional ? "+5531999999999" : "(31) 99999-9999"}
              disabled={isCreatePending}
            />

            <div className="flex items-center gap-2 pt-1">
              <input
                id="numero-internacional"
                type="checkbox"
                className="h-4 w-4"
                checked={numeroInternacional}
                onChange={(event) => handleNumeroInternacionalToggle(event.target.checked)}
              />
              <label htmlFor="numero-internacional" className="text-xs text-subtle">
                Numero internacional
              </label>
            </div>

            <p className="text-xs text-muted-foreground">
              O numero sera armazenado no formato internacional (ex.: 5531999999999). Deixe em branco
              para preencher depois.
            </p>
          </div>
        </form>
      );
    }

    if (modalStage === "connecting") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-subtle">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Gerando QRCode e aguardando a conexao com o Evolution.</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Abra o WhatsApp, acesse Dispositivos vinculados e escaneie o QRCode exibido abaixo. O
            codigo sera renovado automaticamente a cada 20 segundos.
          </p>

          {modalQr ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={buildQrImageSrc(modalQr)}
                alt="QRCode Evolution"
                className="h-48 w-48 rounded border border-border"
              />
              {modalQr.code ? (
                <p className="text-xs text-foreground break-all">
                  Codigo: <code className="break-all">{modalQr.code}</code>
                </p>
              ) : null}
              {modalQr.pairingCode ? (
                <p className="text-xs text-foreground break-all">
                  Pairing code: <code className="break-all">{modalQr.pairingCode}</code>
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Gerando QRCode...</p>
          )}

          <p className="text-xs text-muted-foreground">
            Assim que a conexao for concluida, esta janela sera atualizada automaticamente.
          </p>
        </div>
      );
    }

    if (modalStage === "connected") {
      return (
        <div className="space-y-3 text-sm text-subtle">
          <p className="font-medium text-green-600">Instancia conectada com sucesso.</p>
          <p>Voce ja pode fechar esta janela e usar a instancia nas suas automacoes.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm text-subtle">
        <p className="font-medium text-red-600">Nao foi possivel concluir a conexao.</p>
        <p>{modalError ?? "Tente novamente em instantes."}</p>
      </div>
    );
  };

  const renderModalFooter = () => {
    if (modalStage === "form") {
      return (
        <>
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit" form="instancia-create-form" disabled={isCreatePending}>
            {isCreatePending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Criar instancia
          </Button>
        </>
      );
    }

    if (modalStage === "connecting") {
      return (
        <Button type="button" variant="outline" onClick={closeModal}>
          Fechar
        </Button>
      );
    }

    if (modalStage === "connected") {
      return (
        <Button type="button" onClick={closeModal}>
          Concluir
        </Button>
      );
    }

    return (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (modalInstance) {
              fetchAndApplyQr(modalInstance, { updateModal: true });
            } else {
              setModalStage("form");
              setModalError(null);
            }
          }}
          disabled={isConnectPending}
        >
          {isConnectPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Tentar novamente
        </Button>
        <Button type="button" onClick={closeModal}>
          Fechar
        </Button>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Instancias Evolution</CardTitle>
            <CardDescription>Gerencie as conexoes do WhatsApp integradas ao Evolution API.</CardDescription>
          </div>
          <Button
            onClick={openModal}
            disabled={isLimitReached || !canManageInstancias}
            title={!canManageInstancias ? "Somente administradores podem cadastrar instancias." : undefined}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova instancia
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-subtle">
          <p>
            Cadastre uma instancia para gerar o QRCode e conectar o WhatsApp. Apos a conexao, voce pode
            sincronizar o webhook, verificar o status e remover o vinculo quando necessario.
          </p>
          <p>
            Limite da conta: {INSTANCIA_LIMITE}.{" "}
            {isLimitReached
              ? "Limite atingido para novas instancias."
              : `Restam ${Math.max(INSTANCIA_LIMITE - listaInstancias.length, 0)} vagas.`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instancias cadastradas</CardTitle>
          <CardDescription>Acompanhe status, QRCode e a integracao com a Evolution.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando instancias...</p>
          ) : listaInstancias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma instancia cadastrada ate o momento.</p>
          ) : (
            <div className="grid gap-4">
              {listaInstancias.map((instancia) => {
                const evolution = instancia.iwh_metadata?.evolution;
                const status = getStatusLabel(instancia);
                const evolutionQr = evolution?.last_qr
                  ? { ...evolution.last_qr, base64: sanitizeBase64(evolution.last_qr.base64) }
                  : undefined;
                const qr = qrCodes[instancia.iwh_id] ?? evolutionQr;
                const qrImageSrc = buildQrImageSrc(qr);
                const info = feedback[instancia.iwh_id];
                const phoneDisplay = formatPhoneForDisplay(
                  instancia.iwh_metadata?.phone_number,
                  instancia.iwh_metadata?.phone_number_is_international,
                );

                return (
                  <div key={instancia.iwh_id} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{instancia.iwh_nome}</p>
                        {phoneDisplay ? (
                          <p className="text-xs text-muted-foreground">Telefone: {phoneDisplay}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          Webhook token: {instancia.iwh_webhook_token ?? "---"}
                        </p>
                        {evolution?.instance_name ? (
                          <p className="text-xs text-muted-foreground">Evolution: {evolution.instance_name}</p>
                        ) : null}
                        {evolution?.missing_at ? (
                          <p className="text-xs text-red-600">
                            Removida na Evolution em {new Date(evolution.missing_at).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => fetchAndApplyQr(instancia)}
                        disabled={connectingId === instancia.iwh_id || isConnectPending || !canManageInstancias}
                        title={!canManageInstancias ? "Somente administradores podem executar esta acao." : undefined}
                      >
                        {connectingId === instancia.iwh_id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          "Gerar QRCode"
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncWebhook(instancia)}
                        disabled={syncingId === instancia.iwh_id || isSyncPending || !canManageInstancias}
                        title={!canManageInstancias ? "Somente administradores podem executar esta acao." : undefined}
                      >
                        {syncingId === instancia.iwh_id ? "Sincronizando..." : "Sincronizar webhook"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshStatus(instancia)}
                        disabled={refreshingId === instancia.iwh_id || isRefreshPending || !canManageInstancias}
                        title={!canManageInstancias ? "Somente administradores podem executar esta acao." : undefined}
                      >
                        {refreshingId === instancia.iwh_id ? "Verificando..." : "Verificar status"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInstancia(instancia)}
                        disabled={deletingId === instancia.iwh_id || isDeletePending || !canManageInstancias}
                        title={!canManageInstancias ? "Somente administradores podem executar esta acao." : undefined}
                      >
                        {deletingId === instancia.iwh_id ? "Excluindo..." : "Excluir"}
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {qrImageSrc ? (
                        <div className="space-y-2">
                          <img
                            src={qrImageSrc}
                            alt="QRCode Evolution"
                            className="h-40 w-40 rounded border border-border"
                          />
                          {qr?.code ? (
                            <p className="text-xs text-foreground break-all">
                              Codigo: <code className="break-all">{qr.code}</code>
                            </p>
                          ) : null}
                          {qr?.pairingCode ? (
                            <p className="text-xs text-foreground break-all">
                              Pairing code: <code className="break-all">{qr.pairingCode}</code>
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhum QRCode gerado ainda.</p>
                      )}
                      {info ? (
                        <p
                          className={`text-xs ${
                            info.type === "success" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {info.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsModalOpen(true);
          } else {
            closeModal();
          }
        }}
        title={{
          form: "Nova instancia Evolution",
          connecting: modalInstance ? `Conectando ${modalInstance.iwh_nome}` : "Conectando instancia",
          connected: "Conexao estabelecida",
          error: "Falha na conexao",
        }[modalStage]}
        description={
          modalStage === "form"
            ? "Informe os dados da instancia e avance para gerar o QRCode de conexao."
            : undefined
        }
        footer={renderModalFooter()}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default InstanciasPage;
