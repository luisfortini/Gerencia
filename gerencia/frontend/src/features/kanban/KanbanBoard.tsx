import { useEffect, useMemo, useState } from 'react';
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
  negociacao: 'Negociação',
  follow_up: 'Follow-up',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

const statusOrder: LeadStatus[] = ['novo', 'qualificado', 'interessado', 'negociacao', 'follow_up', 'ganho', 'perdido'];

interface KanbanBoardProps {
  columns: Record<LeadStatus, Lead[]>;
  onChangeStatus: (lead: Lead, status: LeadStatus, payload?: { valor_total?: number; motivo?: string }) => Promise<void>;
}

interface PendingTransition {
  lead: Lead;
  fromStatus: LeadStatus;
  toStatus: LeadStatus;
}

export const KanbanBoard = ({ columns, onChangeStatus }: KanbanBoardProps) => {
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
      motivo = window.prompt('Informe o motivo para retroceder o lead:', 'Revisão necessária') ?? undefined;
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
      next[toStatus] = [...next[toStatus], { ...lead, led_status: toStatus }];
      return next;
    });

    await onChangeStatus(lead, toStatus, payload);
  };

  const confirmarGanho = async () => {
    if (!pending) return;
    const valor = Number(valorTotal.replace(',', '.'));
    if (Number.isNaN(valor) || valor <= 0) {
      alert('Informe um valor total válido.');
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statusOrder.map((status) => (
            <KanbanColumn key={status} status={status} leads={board[status]} onMove={requestStatusChange} />
          ))}
        </div>
      </DndContext>

      <Modal
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Registrar lead como ganho"
        description="Informe o valor total da negociação para concluir o ganho."
        footer={
          <>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarGanho}>Confirmar</Button>
          </>
        }
      >
        <label className="text-sm font-medium text-gray-700">Valor total (R$)</label>
        <Input value={valorTotal} onChange={(event) => setValorTotal(event.target.value)} placeholder="Ex: 1999.90" />
      </Modal>
    </>
  );
};

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onMove: (lead: Lead, fromStatus: LeadStatus, targetStatus: LeadStatus) => void;
}

const KanbanColumn = ({ status, leads, onMove }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={
        'flex h-full min-h-[420px] flex-col rounded-xl border border-border bg-white p-4 transition' +
        (isOver ? ' ring-2 ring-primary ring-offset-2' : '')
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{statusTitles[status]}</h2>
        <span className="text-xs text-gray-400">{leads.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {leads.map((lead) => (
          <KanbanCard key={lead.led_id} lead={lead} status={status} onMove={onMove} />
        ))}
        {leads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-gray-400">
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
}

const KanbanCard = ({ lead, status, onMove }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.led_id}`,
    data: { lead, status },
  });

  const style = useMemo(() => ({
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }), [transform, isDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab rounded-lg border border-border bg-white p-3 shadow-sm"
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{lead.led_nome}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-xs text-gray-500">Confiança IA: {Math.round((lead.led_status_conf ?? 0) * 100)}%</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Button variant="outline" size="sm" onClick={() => onMove(lead, status, 'ganho')}>
          Marcar como ganho
        </Button>
        {status !== 'novo' ? (
          <Button variant="ghost" size="sm" onClick={() => onMove(lead, status, 'interessado')}>
            Retroceder
          </Button>
        ) : null}
      </div>
    </div>
  );
};
