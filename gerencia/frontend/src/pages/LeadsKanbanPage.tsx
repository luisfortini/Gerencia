import { useState } from 'react';
import { useKanbanLeads } from '@/hooks/useKanbanLeads';
import { KanbanBoard } from '@/features/kanban/KanbanBoard';
import type { Lead, LeadStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export const LeadsKanbanPage = () => {
  const { data, isLoading, refetch } = useKanbanLeads();
  const [isSaving, setIsSaving] = useState(false);

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
          <p className="text-sm text-gray-500">Sincronizando leads para o quadro Kanban.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isSaving ? (
        <p className="text-xs text-gray-500">Aplicando atualização de status...</p>
      ) : null}
      <KanbanBoard columns={data} onChangeStatus={handleChangeStatus} />
    </div>
  );
};
