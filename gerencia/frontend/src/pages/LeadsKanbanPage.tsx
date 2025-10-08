import { useState } from 'react';
import { useKanbanLeads } from '@/hooks/useKanbanLeads';
import { KanbanBoard } from '@/features/kanban/KanbanBoard';
import type { Lead, LeadStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { LeadDrawer } from '@/features/leads/LeadDrawer';
import { useLeadDetails } from '@/hooks/useLeadDetails';

export const LeadsKanbanPage = () => {
  const { data, isLoading, refetch } = useKanbanLeads();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const leadDetails = useLeadDetails(selectedLeadId);

  const handleChangeStatus = async (
    lead: Lead,
    status: LeadStatus,
    payload?: { valor_total?: number; motivo?: string }
  ) => {
    try {
      setIsSaving(true);
      await api.post(`/leads/${lead.led_id}/status`, {
        status,
        valor_total: payload?.valor_total,
        motivo: payload?.motivo,
      });
      await refetch();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando Kanban...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sincronizando leads para o quadro Kanban.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden gap-4 lg:gap-6">
      {isSaving ? <p className="shrink-0 text-xs text-muted-foreground">Aplicando atualizacao de status...</p> : null}
      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard
          columns={data}
          onChangeStatus={handleChangeStatus}
          onOpenLead={(lead) => setSelectedLeadId(lead.led_id)}
        />
      </div>
      <LeadDrawer
        lead={leadDetails.data ?? null}
        open={Boolean(selectedLeadId && leadDetails.data)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLeadId(null);
          }
        }}
      />
    </div>
  );
};

