import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Lead, LeadStatus } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const statusTitles: Record<LeadStatus, string> = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  interessado: 'Interessado',
  negociacao: 'Negociacao',
  follow_up: 'Follow-up',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

const statusOrder: LeadStatus[] = ['novo', 'qualificado', 'interessado', 'negociacao', 'follow_up', 'ganho', 'perdido'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const parseValorTotal = (raw: Lead['led_valor_total'] | null | undefined): number | null => {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let normalized = trimmed.replace(/[^\d.,-]/g, '');
  if (!normalized) {
    return null;
  }
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

interface KanbanBoardProps {
  columns: Record<LeadStatus, Lead[]>;
  onChangeStatus: (lead: Lead, status: LeadStatus, payload?: { valor_total?: number; motivo?: string }) => Promise<void>;
  onOpenLead: (lead: Lead) => void;
}

interface PendingTransition {
  lead: Lead;
  fromStatus: LeadStatus;
  toStatus: LeadStatus;
}

export const KanbanBoard = ({ columns, onChangeStatus, onOpenLead }: KanbanBoardProps) => {
  const [board, setBoard] = useState(columns);
  const [pending, setPending] = useState<PendingTransition | null>(null);
  const [valorTotal, setValorTotal] = useState('');

  useEffect(() => {
    setBoard(columns);
  }, [columns]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const requestStatusChange = async (lead: Lead, fromStatus: LeadStatus, targetStatus: LeadStatus) => {
    if (fromStatus === targetStatus) return;

    const isRetrocesso = statusOrder.indexOf(targetStatus) < statusOrder.indexOf(fromStatus);
    let motivo: string | undefined;
    if (isRetrocesso) {
      motivo = window.prompt('Informe o motivo para retroceder o lead:', 'Revisao necessaria') ?? undefined;
      if (!motivo) {
        return;
      }
    }

    if (targetStatus === 'ganho') {
      setPending({ lead, fromStatus, toStatus: targetStatus });
      setValorTotal('');
      return;
    }

    await aplicarMudanca({ lead, fromStatus, toStatus: targetStatus, payload: { motivo } });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const lead = event.active.data.current?.lead as Lead | undefined;
    const fromStatus = event.active.data.current?.status as LeadStatus | undefined;
    const targetStatus = event.over?.id as LeadStatus | undefined;

    if (!lead || !fromStatus || !targetStatus) {
      return;
    }

    await requestStatusChange(lead, fromStatus, targetStatus);
  };

  const aplicarMudanca = async ({
    lead,
    fromStatus,
    toStatus,
    payload,
  }: {
    lead: Lead;
    fromStatus: LeadStatus;
    toStatus: LeadStatus;
    payload?: { valor_total?: number; motivo?: string };
  }) => {
    setBoard((prev) => {
      const next: Record<LeadStatus, Lead[]> = { ...prev } as Record<LeadStatus, Lead[]>;
      next[fromStatus] = next[fromStatus].filter((item) => item.led_id !== lead.led_id);
      const atualizado = { ...lead, led_status: toStatus } as Lead;
      if (payload?.valor_total !== undefined) {
        atualizado.led_valor_total = payload.valor_total;
      }
      next[toStatus] = [...next[toStatus], atualizado];
      return next;
    });

    await onChangeStatus(lead, toStatus, payload);
  };

  const confirmarGanho = async () => {
    if (!pending) return;
    const valor = Number(valorTotal.replace(',', '.'));
    if (Number.isNaN(valor) || valor <= 0) {
      alert('Informe um valor total valido.');
      return;
    }

    await aplicarMudanca({
      lead: pending.lead,
      fromStatus: pending.fromStatus,
      toStatus: pending.toStatus,
      payload: { valor_total: valor },
    });

    setPending(null);
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto pb-2 pr-2">
          {statusOrder.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={board[status]}
              onMove={requestStatusChange}
              onOpenLead={onOpenLead}
            />
          ))}
        </div>
      </DndContext>

      <Modal
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Registrar lead como ganho"
        description="Informe o valor total da negociacao para concluir o ganho."
        footer={
          <>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarGanho}>Confirmar</Button>
          </>
        }
      >
        <label className="text-sm font-medium text-foreground">Valor total (R$)</label>
        <Input value={valorTotal} onChange={(event) => setValorTotal(event.target.value)} placeholder="Ex: 1999.90" />
      </Modal>
    </>
  );
};

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onMove: (lead: Lead, fromStatus: LeadStatus, targetStatus: LeadStatus) => void;
  onOpenLead: (lead: Lead) => void;
}

const KanbanColumn = ({ status, leads, onMove, onOpenLead }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { total, hasValores } = useMemo(() => {
    let soma = 0;
    let possui = false;
    for (const lead of leads) {
      const valor = parseValorTotal(lead.led_valor_total);
      if (valor !== null) {
        soma += valor;
        possui = true;
      }
    }
    return { total: soma, hasValores: possui };
  }, [leads]);
  const totalFormatado = hasValores ? formatCurrency(total) : null;

  return (
    <div
      ref={setNodeRef}
      className={
        'flex h-full min-h-[420px] w-[300px] flex-shrink-0 flex-col rounded-xl border border-border bg-surface p-4 transition' +
        (isOver ? ' ring-2 ring-primary ring-offset-2' : '')
      }
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{statusTitles[status]}</h2>
          <p className="text-xs text-muted-foreground">Total: {totalFormatado ?? '--'}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{leads.length}</span>
      </div>
      <div className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {leads.map((lead) => (
          <KanbanCard key={lead.led_id} lead={lead} status={status} onMove={onMove} onOpenLead={onOpenLead} />
        ))}
        {leads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Arraste leads para esta etapa
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface KanbanCardProps {
  lead: Lead;
  status: LeadStatus;
  onMove: (lead: Lead, fromStatus: LeadStatus, targetStatus: LeadStatus) => void;
  onOpenLead: (lead: Lead) => void;
}

const KanbanCard = ({ lead, status, onMove, onOpenLead }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.led_id}`,
    data: { lead, status },
  });

  const style = useMemo(
    () => ({
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    }),
    [transform, isDragging]
  );

  const valorNumerico = parseValorTotal(lead.led_valor_total);
  const valorNegociado = valorNumerico !== null ? formatCurrency(valorNumerico) : null;
  const responsavelLabel =
    lead.responsavel?.usr_nome ??
    (lead.led_responsavel_usrid ? `Usuario #${lead.led_responsavel_usrid}` : 'Nao atribuido');

  const stopPropagation = (event: PointerEvent | MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab rounded-lg border border-border bg-surface p-3 shadow-sm"
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{lead.led_nome}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Confianca IA: {Math.round((lead.led_status_conf ?? 0) * 100)}%</p>
      <p className="mt-1 text-xs text-muted-foreground">Valor negociado: {valorNegociado ?? 'Nao informado'}</p>
      <p className="mt-1 text-xs text-muted-foreground">Responsavel: {responsavelLabel}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Button
          size="sm"
          variant="outline"
          onPointerDown={stopPropagation}
          onClick={(event) => {
            stopPropagation(event);
            onOpenLead(lead);
          }}
        >
          Detalhes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPointerDown={stopPropagation}
          onClick={(event) => {
            stopPropagation(event);
            onMove(lead, status, 'ganho');
          }}
        >
          Marcar como ganho
        </Button>
        {status !== 'novo' ? (
          <Button
            variant="ghost"
            size="sm"
            onPointerDown={stopPropagation}
            onClick={(event) => {
              stopPropagation(event);
              onMove(lead, status, 'interessado');
            }}
          >
            Retroceder
          </Button>
        ) : null}
      </div>
    </div>
  );
};
