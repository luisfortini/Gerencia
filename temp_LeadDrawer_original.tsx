import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Drawer } from '@/components/ui/drawer';

import { StatusBadge } from '@/components/StatusBadge';

import { Select } from '@/components/ui/select';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { Lead } from '@/types';

import { useContaUsuarios } from '@/hooks/useContaUsuarios';

import { useLeadAssignment } from '@/hooks/useLeadAssignment';

import { cn } from '@/lib/utils';
import { api } from '@/lib/api';



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

    console.warn('Não foi possível interpretar os dados armazenados do usuário.', error);

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


  const queryClient = useQueryClient();


  const [selectedResponsavel, setSelectedResponsavel] = useState<string>('');

  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [valorNegociacao, setValorNegociacao] = useState('');
  const [valorFeedback, setValorFeedback] = useState<FeedbackState>(null);
  const [isSavingValor, setIsSavingValor] = useState(false);
  const [observacoesLead, setObservacoesLead] = useState('');
  const [observacoesFeedback, setObservacoesFeedback] = useState<FeedbackState>(null);
  const [isSavingObservacoes, setIsSavingObservacoes] = useState(false);
  const [iaFeedback, setIaFeedback] = useState<FeedbackState>(null);
  const [isApplyingIa, setIsApplyingIa] = useState(false);

  const parseNumero = (value: unknown) => {
    if (value === null || value === undefined) {
      return null;
    }
    const numero = Number(value);
    return Number.isFinite(numero) ? numero : null;
  };



  const contaUsuarios = useContaUsuarios({ enabled: canAssign && open });

  const assignMutation = useLeadAssignment();



  useEffect(() => {

    if (lead?.led_responsavel_usrid) {

      setSelectedResponsavel(String(lead.led_responsavel_usrid));

    } else {

      setSelectedResponsavel('');

    }
    if (lead?.led_valor_total !== null && lead?.led_valor_total !== undefined) {
      setValorNegociacao(String(lead.led_valor_total));
    } else {
      setValorNegociacao('');
    }
    if (lead?.led_observacoes) {
      setObservacoesLead(String(lead.led_observacoes));
    } else {
      setObservacoesLead('');
    }

    setFeedback(null);
    setValorFeedback(null);
    setObservacoesFeedback(null);
    setIaFeedback(null);

  }, [lead?.led_id, lead?.led_responsavel_usrid, lead?.led_valor_total, lead?.led_observacoes]);



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

        message: responsavelId ? 'Responsável atualizado com sucesso.' : 'Lead desatribuído.',

      });

    } catch (error) {

      setFeedback({

        type: 'error',

        message: resolveErrorMessage(error, 'Não foi possível atualizar o responsavel.'),

      });

    }

  };



  const responsavelAtual = lead.responsavel?.usr_nome

    ?? (lead.led_responsavel_usrid ? `Usuario #${lead.led_responsavel_usrid}` : 'Não atribuído');



  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const valorAtualNumero = valorNegociacao.trim() === '' ? null : Number(valorNegociacao);
  const valorAtual =
    valorAtualNumero !== null && Number.isFinite(valorAtualNumero)
      ? formatCurrency(valorAtualNumero)
      : 'Nao informado';

  const handleValorSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValorFeedback(null);
    setIsSavingValor(true);

    try {
      const raw = valorNegociacao.trim();
      const valor = raw === '' ? null : Number(raw);

      if (raw !== '' && !Number.isFinite(valor)) {
        setValorFeedback({ type: 'error', message: 'Informe um valor valido para a negociacao.' });
        return;
      }

      const { data } = await api.patch(`/leads/${lead.led_id}`, {
        led_valor_total: valor,
      });

      if (data?.led_valor_total !== undefined && data?.led_valor_total !== null) {
        setValorNegociacao(String(data.led_valor_total));
      } else {
        setValorNegociacao('');
      }

      setValorFeedback({
        type: 'success',
        message: valor === null ? 'Valor removido com sucesso.' : 'Valor atualizado com sucesso.',
      });
    } catch (error) {
      setValorFeedback({
        type: 'error',
        message: resolveErrorMessage(error, 'Não foi possivel atualizar o valor da negociação.'),
      });
    } finally {
      setIsSavingValor(false);
    }
  };

  const handleObservacoesSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setObservacoesFeedback(null);
    setIsSavingObservacoes(true);

    try {
      const raw = observacoesLead.trim();
      const payload = raw === '' ? null : raw;

      await api.patch(`/leads/${lead.led_id}`, {
        led_observacoes: payload,
      });

      setObservacoesLead(raw);
      setObservacoesFeedback({
        type: 'success',
        message: payload === null ? 'Observacoes removidas com sucesso.' : 'Observacoes atualizadas com sucesso.',
      });
    } catch (error) {
      setObservacoesFeedback({
        type: 'error',
        message: resolveErrorMessage(error, 'Nao foi possivel atualizar as observacoes.'),
      });
    } finally {
      setIsSavingObservacoes(false);
    }
  };

  const auditoriasIa = Array.isArray(lead.auditorias_ia)
    ? lead.auditorias_ia
    : Array.isArray(lead.auditoriasIa)
      ? lead.auditoriasIa
      : [];
  const sugestaoIa = auditoriasIa.find((item) => item.aia_status === 'processado' && item.aia_resposta);
  const ultimaAuditoriaErro = auditoriasIa.find((item) => item.aia_status === 'erro');
  const iaResposta = sugestaoIa?.aia_resposta ?? null;
  const detalhesIa =
    iaResposta && typeof iaResposta.detalhes === 'object' && iaResposta.detalhes !== null
      ? (iaResposta.detalhes as Record<string, unknown>)
      : null;
  const sugestaoStatusBruta = typeof iaResposta?.status === 'string' ? iaResposta.status.toLowerCase() : null;
  const statusPermitidos = new Set(['novo', 'qualificado', 'interessado', 'negociacao', 'follow_up', 'ganho', 'perdido']);
  const sugestaoStatus =
    sugestaoStatusBruta && statusPermitidos.has(sugestaoStatusBruta) ? sugestaoStatusBruta : null;
  const sugestaoConfianca = typeof iaResposta?.status_conf === 'number' ? iaResposta.status_conf : null;
  const sugestaoValorNumero = parseNumero(iaResposta?.valor_total);
  const sugestaoObjecao = typeof iaResposta?.objecao === 'string' ? iaResposta.objecao : null;
  const sugestaoResponsavelId = parseNumero(iaResposta?.responsavel_id);
  const sugestaoResponsavelNome = typeof iaResposta?.responsavel_nome === 'string' ? iaResposta.responsavel_nome : null;

  const statusOrdem: Record<string, number> = {
    novo: 1,
    qualificado: 2,
    interessado: 3,
    negociacao: 4,
    follow_up: 5,
    ganho: 6,
    perdido: 7,
  };
  const retrocedeu =
    sugestaoStatus && statusOrdem[sugestaoStatus] < (statusOrdem[lead.led_status] ?? 0);
  const motivoRetrocessoRaw = detalhesIa
    ? detalhesIa['motivo_retrocesso'] ?? detalhesIa['observacoes_relevantes']
    : null;
  const motivoRetrocesso = typeof motivoRetrocessoRaw === 'string' ? motivoRetrocessoRaw : null;

  const valorAtualLead = parseNumero(lead.led_valor_total);
  const podeAplicarStatus = Boolean(sugestaoStatus && sugestaoStatus !== lead.led_status);
  const podeAplicarValor =
    sugestaoValorNumero !== null && (valorAtualLead === null || valorAtualLead !== sugestaoValorNumero);
  const podeAplicarResponsavel =
    Boolean(canAssign && sugestaoResponsavelId !== null && lead.led_responsavel_usrid !== sugestaoResponsavelId);
  const temSugestoesAplicaveis = podeAplicarStatus || podeAplicarValor || podeAplicarResponsavel;

  const sugestaoCriadaEm = sugestaoIa?.created_at ? new Date(sugestaoIa.created_at) : null;
  const sugestaoCriadaEmLabel =
    sugestaoCriadaEm && !Number.isNaN(sugestaoCriadaEm.getTime())
      ? sugestaoCriadaEm.toLocaleString('pt-BR')
      : null;

  const handleAplicarSugestaoIa = async () => {
    if (!sugestaoIa || !iaResposta) {
      setIaFeedback({ type: 'error', message: 'Nenhuma sugestao disponivel para este lead.' });
      return;
    }

    if (!temSugestoesAplicaveis) {
      setIaFeedback({ type: 'error', message: 'Nenhuma sugestao aplicavel para este lead.' });
      return;
    }

    if (podeAplicarStatus && sugestaoStatus === 'ganho' && sugestaoValorNumero === null) {
      setIaFeedback({
        type: 'error',
        message: 'A IA sugeriu ganho sem valor. Informe o valor antes de aplicar o status.',
      });
      return;
    }

    setIaFeedback(null);
    setIsApplyingIa(true);

    const aplicados: string[] = [];
    let valorAplicadoViaStatus = false;
    let valorAplicadoViaPatch = false;
    let responsavelAplicadoViaPatch = false;

    try {
      if (podeAplicarStatus && sugestaoStatus) {
        const payload: { status: string; valor_total?: number; motivo?: string } = {
          status: sugestaoStatus,
        };

        if (sugestaoValorNumero !== null) {
          payload.valor_total = sugestaoValorNumero;
        }

        if (retrocedeu) {
          payload.motivo = motivoRetrocesso ?? 'Sugestao IA';
        }

        await api.post(`/leads/${lead.led_id}/status`, payload);
        aplicados.push('status');
        if (payload.valor_total !== undefined) {
          valorAplicadoViaStatus = true;
        }
      }

      const patchPayload: Record<string, unknown> = {};
      if (podeAplicarValor && !valorAplicadoViaStatus && sugestaoValorNumero !== null) {
        patchPayload.led_valor_total = sugestaoValorNumero;
      }
      if (podeAplicarResponsavel && sugestaoResponsavelId !== null) {
        patchPayload.led_responsavel_usrid = sugestaoResponsavelId;
      }

      if (Object.keys(patchPayload).length) {
        await api.patch(`/leads/${lead.led_id}`, patchPayload);
        valorAplicadoViaPatch = 'led_valor_total' in patchPayload;
        responsavelAplicadoViaPatch = 'led_responsavel_usrid' in patchPayload;
        if (valorAplicadoViaPatch) {
          aplicados.push('valor');
        }
        if (responsavelAplicadoViaPatch) {
          aplicados.push('responsavel');
        }
      }

      if (aplicados.length) {
        setIaFeedback({
          type: 'success',
          message: `Sugestao aplicada: ${aplicados.join(', ')}.`,
        });
      } else {
        setIaFeedback({ type: 'error', message: 'Nenhuma sugestao aplicada.' });
      }

      if (sugestaoValorNumero !== null && (valorAplicadoViaStatus || valorAplicadoViaPatch)) {
        setValorNegociacao(String(sugestaoValorNumero));
      }

      if (responsavelAplicadoViaPatch && sugestaoResponsavelId !== null) {
        setSelectedResponsavel(String(sugestaoResponsavelId));
      }

      queryClient.invalidateQueries({ queryKey: ['lead', lead.led_id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-kanban'] });
    } catch (error) {
      setIaFeedback({
        type: 'error',
        message: resolveErrorMessage(error, 'Nao foi possivel aplicar a sugestao da IA.'),
      });
    } finally {
      setIsApplyingIa(false);
    }
  };

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

            Responsável atual: <span className="font-medium text-foreground">{responsavelAtual}</span>

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

            <h3 className="text-sm font-semibold text-foreground">Atribuição de responsável</h3>

            <p className="mt-2 text-xs text-muted-foreground">

              Somente gestores ou administradores podem alterar o responsável do lead.

            </p>

          </section>

        )}



        <section>
          <h3 className="text-sm font-semibold text-foreground">Valor da negociação</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Atual: <span className="font-medium text-foreground">{valorAtual}</span>
          </p>
          <form onSubmit={handleValorSubmit} className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex min-w-[220px] flex-1 flex-col gap-2">
              <label className="text-xs font-medium text-foreground" htmlFor="lead-valor-negociacao">
                Valor estimado
              </label>
              <Input
                id="lead-valor-negociacao"
                type="number"
                step="0.01"
                min="0"
                value={valorNegociacao}
                onChange={(event) => setValorNegociacao(event.target.value)}
                placeholder="Ex: 1500"
              />
            </div>
            <Button type="submit" size="sm" disabled={isSavingValor}>
              {isSavingValor ? 'Salvando...' : 'Salvar valor'}
            </Button>
          </form>
          {valorFeedback ? (
            <p className={`mt-2 text-xs ${valorFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {valorFeedback.message}
            </p>
          ) : null}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground">Informações relevantes</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Informações do lead que ajudam a IA e o time a interpretar as mensagens.
          </p>
          <form onSubmit={handleObservacoesSubmit} className="mt-3 space-y-3">
            <Textarea
              id="lead-observacoes"
              value={observacoesLead}
              onChange={(event) => setObservacoesLead(event.target.value)}
              placeholder="Ex: prefere contato por WhatsApp, ja pediu proposta, perfil decisor..."
              maxLength={2000}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={isSavingObservacoes}>
                {isSavingObservacoes ? 'Salvando...' : 'Salvar observações'}
              </Button>
              {observacoesFeedback ? (
                <span className={`text-xs ${observacoesFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {observacoesFeedback.message}
                </span>
              ) : null}
            </div>
          </form>
        </section>

        <section className="space-y-3">

          <h3 className="text-sm font-semibold text-foreground">Conversas recentes</h3>

          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3 pr-2">

            {mensagensOrdenadas.length ? (

              mensagensOrdenadas.map((msg) => {

                const isInbound = msg.msg_direcao === 'in';
                const tipoMidia = msg.msg_tipomidia?.toLowerCase() ?? null;
                const mediaUrl = resolveMensagemMidiaUrl(msg);
                const imageUrl = tipoMidia === 'imagem' ? mediaUrl : null;
                const audioUrl = tipoMidia === 'audio' ? mediaUrl : null;
                const texto = msg.msg_conteudo ?? '';
                const hasTexto = texto.trim().length > 0;



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

                      {imageUrl ? (
                        <a href={imageUrl} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={imageUrl}
                            alt={hasTexto ? texto : 'Imagem recebida'}
                            className="max-h-64 w-auto max-w-full rounded-lg border border-border object-cover"
                          />
                        </a>
                      ) : null}

                      {audioUrl ? (
                        <audio className="mt-1 w-full max-w-xs" controls preload="metadata" src={audioUrl}>
                          Seu navegador nao suporta reproducao de audio.
                        </audio>
                      ) : null}

                      {hasTexto ? (
                        <p
                          className={cn(
                            'whitespace-pre-line break-words text-sm leading-relaxed',
                            (imageUrl || audioUrl) && 'mt-2'
                          )}
                        >
                          {texto}
                        </p>
                      ) : null}

                      {!hasTexto && !imageUrl && !audioUrl ? (
                        <p className="text-sm italic opacity-80">Conteudo indisponivel.</p>
                      ) : null}

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

          <h3 className="text-sm font-semibold text-foreground">Sugestões da IA</h3>

          {sugestaoIa ? (
            <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Provider: {sugestaoIa.aia_provider ?? 'desconhecido'}</span>
                {sugestaoCriadaEmLabel ? <span>Gerado em: {sugestaoCriadaEmLabel}</span> : null}
              </div>
              <div className="grid gap-2 text-sm">
                <div>
                  Status sugerido:{' '}
                  <span className="font-medium text-foreground">{sugestaoStatus ?? 'indisponivel'}</span>
                  {sugestaoConfianca !== null ? (
                    <span className="text-muted-foreground"> ({Math.round(sugestaoConfianca * 100)}%)</span>
                  ) : null}
                </div>
                <div>
                  Valor sugerido:{' '}
                  <span className="font-medium text-foreground">
                    {sugestaoValorNumero !== null ? formatCurrency(sugestaoValorNumero) : 'Nao informado'}
                  </span>
                </div>
                {sugestaoObjecao ? (
                  <div>
                    Objecao: <span className="font-medium text-foreground">{sugestaoObjecao}</span>
                  </div>
                ) : null}
                {sugestaoResponsavelId !== null ? (
                  <div>
                    Responsável sugerido:{' '}
                    <span className="font-medium text-foreground">
                      {sugestaoResponsavelNome
                        ? `${sugestaoResponsavelNome} (#${sugestaoResponsavelId})`
                        : `Usuario #${sugestaoResponsavelId}`}
                    </span>
                  </div>
                ) : null}
                {motivoRetrocesso ? (
                  <div>
                    Motivo do retrocesso:{' '}
                    <span className="font-medium text-foreground">{motivoRetrocesso}</span>
                  </div>
                ) : null}
              </div>
              {!canAssign && sugestaoResponsavelId !== null ? (
                <p className="text-xs text-muted-foreground">
                  Somente gestores ou administradores podem aplicar o responsável sugerido.
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAplicarSugestaoIa}
                  disabled={!temSugestoesAplicaveis || isApplyingIa}
                >
                  {isApplyingIa ? 'Aplicando...' : 'Aplicar sugestao'}
                </Button>
                {!temSugestoesAplicaveis ? (
                  <span className="text-xs text-muted-foreground">
                    Nenhuma sugestão pendente para aplicar.
                  </span>
                ) : null}
              </div>
              {iaFeedback ? (
                <p className={`text-xs ${iaFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {iaFeedback.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 space-y-2 text-sm text-subtle">
              <p>
                Quando a IA processar novas mensagens, as sugestões aparecerõo aqui para facilitar a decisão do time.
              </p>
              {ultimaAuditoriaErro ? (
                <p className="text-xs text-red-600">A última tentativa da IA retornou erro.</p>
              ) : null}
            </div>
          )}

        </section>

      </div>

    </Drawer>

  );

};

const resolveMensagemMidiaUrl = (mensagem: NonNullable<Lead['mensagens']>[number]) => {
  const raw = mensagem.msg_urlmidia;
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  const sanitized = raw.startsWith('/')
    ? raw.slice(1)
    : raw;

  const path = sanitized.startsWith('storage/')
    ? sanitized
    : `storage/${sanitized}`;

  const base = api.defaults.baseURL;

  if (!base) {
    return `/${path}`;
  }

  const root = base.replace(/\/+api\/?$/, '').replace(/\/+$/, '');

  if (!root) {
    return `/${path}`;
  }

  return `${root}/${path}`;
};
