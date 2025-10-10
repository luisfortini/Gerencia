import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { StatusBadge } from '@/components/StatusBadge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Lead } from '@/types';
import { useContaUsuarios } from '@/hooks/useContaUsuarios';
import { useLeadAssignment } from '@/hooks/useLeadAssignment';
import { cn } from '@/lib/utils';

interface LeadDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const parseStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem('gerencia_usuario');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { admin?: boolean; superadmin?: boolean; papel?: string } | null;
  } catch (error) {
    console.warn('Nao foi possivel interpretar os dados armazenados do usuario.', error);
    return null;
  }
};

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    const message = response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const LeadDrawer = ({ lead, open, onOpenChange }: LeadDrawerProps) => {
  const storedUser = useMemo(() => parseStoredUser(), []);
  const canAssign =
    storedUser?.admin === true || storedUser?.superadmin === true || storedUser?.papel === 'gestor';

  const [selectedResponsavel, setSelectedResponsavel] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const contaUsuarios = useContaUsuarios({ enabled: canAssign && open });
  const assignMutation = useLeadAssignment();

  useEffect(() => {
    if (lead?.led_responsavel_usrid) {
      setSelectedResponsavel(String(lead.led_responsavel_usrid));
    } else {
      setSelectedResponsavel('');
    }
    setFeedback(null);
  }, [lead?.led_id, lead?.led_responsavel_usrid]);

  const mensagensOrdenadas = useMemo(() => {
    if (!lead?.mensagens?.length) {
      return [] as NonNullable<Lead['mensagens']>;
    }

    return [...lead.mensagens].sort((a, b) => {
      const dataA = a.msg_recebido_em ? new Date(a.msg_recebido_em).getTime() : 0;
      const dataB = b.msg_recebido_em ? new Date(b.msg_recebido_em).getTime() : 0;
      return dataA - dataB;
    });
  }, [lead?.mensagens]);

  if (!lead) return null;

  const isLoadingUsuarios = contaUsuarios.isLoading || contaUsuarios.isFetching;
  const usuariosAtivos = contaUsuarios.data ?? [];

  const formatHorarioMensagem = (value?: string) => {
    if (!value) return '';

    const data = new Date(value);
    if (Number.isNaN(data.getTime())) {
      return '';
    }

    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    try {
      const responsavelId = selectedResponsavel === '' ? null : Number(selectedResponsavel);
      const updated = await assignMutation.mutateAsync({
        leadId: lead.led_id,
        responsavelId,
      });

      setSelectedResponsavel(updated.led_responsavel_usrid ? String(updated.led_responsavel_usrid) : '');
      setFeedback({
        type: 'success',
        message: responsavelId ? 'Responsavel atualizado com sucesso.' : 'Lead desatribuido.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: resolveErrorMessage(error, 'Nao foi possivel atualizar o responsavel.'),
      });
    }
  };

  const responsavelAtual = lead.responsavel?.usr_nome
    ?? (lead.led_responsavel_usrid ? `Usuario #${lead.led_responsavel_usrid}` : 'Nao atribuido');

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={lead.led_nome}
      description={lead.led_email ?? 'Sem e-mail cadastrado'}
    >
      <div className="space-y-6">
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={lead.led_status} />
            <span className="text-sm text-muted-foreground">
              Confianca: {Math.round((lead.led_status_conf ?? 0) * 100)}%
            </span>
          </div>
          <p className="mt-2 text-sm text-subtle">
            Responsavel atual: <span className="font-medium text-foreground">{responsavelAtual}</span>
          </p>
        </section>

        {canAssign ? (
          <section>
            <h3 className="text-sm font-semibold text-foreground">Atribuir responsavel</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Escolha um membro ativo da conta para acompanhar este lead. A IA tambem pode sugerir automaticamente.
            </p>
            <form onSubmit={handleSubmit} className="mt-3 space-y-3">
              <Select
                value={selectedResponsavel}
                onChange={(event) => setSelectedResponsavel(event.target.value)}
              >
                <option value="">Sem responsavel</option>
                {usuariosAtivos.map((usuario) => (
                  <option key={usuario.id} value={String(usuario.id)}>
                    {usuario.nome} ({usuario.papel ?? 'Sem papel'})
                  </option>
                ))}
              </Select>
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm" disabled={assignMutation.isPending || isLoadingUsuarios}>
                  {assignMutation.isPending ? 'Salvando...' : 'Atualizar responsavel'}
                </Button>
                {isLoadingUsuarios ? (
                  <span className="text-xs text-muted-foreground">Carregando usuarios...</span>
                ) : null}
                {!isLoadingUsuarios && usuariosAtivos.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Nenhum usuario ativo disponivel.</span>
                ) : null}
                {contaUsuarios.isError ? (
                  <span className="text-xs text-red-600">Nao foi possivel carregar os usuarios.</span>
                ) : null}
              </div>
              {feedback ? (
                <p className={`text-xs ${feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {feedback.message}
                </p>
              ) : null}
            </form>
          </section>
        ) : (
          <section>
            <h3 className="text-sm font-semibold text-foreground">Atribuicao de responsavel</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Somente gestores ou administradores podem alterar o responsavel do lead.
            </p>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Conversas recentes</h3>
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3 pr-2">
            {mensagensOrdenadas.length ? (
              mensagensOrdenadas.map((msg) => {
                const isInbound = msg.msg_direcao === 'in';

                return (
                  <div
                    key={msg.msg_id}
                    className={cn('flex w-full', isInbound ? 'justify-start' : 'justify-end')}
                  >
                    <div
                      className={cn(
                        'relative max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm transition',
                        isInbound
                          ? 'bg-white/85 text-foreground ring-1 ring-border'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      <p className="whitespace-pre-line break-words text-sm leading-relaxed">{msg.msg_conteudo}</p>
                      <div
                        className={cn(
                          'mt-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide',
                          isInbound ? 'text-slate-400' : 'text-primary-foreground/80'
                        )}
                      >
                        <span>{isInbound ? 'Cliente' : 'Equipe'}</span>
                        {msg.msg_recebido_em ? <span>{formatHorarioMensagem(msg.msg_recebido_em)}</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem registrada para este lead.</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground">Sugestoes da IA</h3>
          <p className="mt-2 text-sm text-subtle">
            Quando a IA processar novas mensagens, as sugestoes aparecerao aqui para facilitar a decisao do time.
          </p>
        </section>
      </div>
    </Drawer>
  );
};
