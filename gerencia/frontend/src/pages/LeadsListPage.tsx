import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadsTable } from '@/features/leads/LeadsTable';
import { LeadDrawer } from '@/features/leads/LeadDrawer';
import { useLeads } from '@/hooks/useLeads';
import { useLeadDetails } from '@/hooks/useLeadDetails';
import type { LeadStatus } from '@/types';

const statusOptions: { value: LeadStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'novo', label: 'Novo' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'interessado', label: 'Interessado' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'perdido', label: 'Perdido' },
];

export const LeadsListPage = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | 'todos'>('todos');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const { data, isLoading } = useLeads({
    search: search || undefined,
    status: status === 'todos' ? undefined : status,
  });

  const leadDetails = useLeadDetails(selectedLeadId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leads - Lista Inteligente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
            <Input placeholder="Buscar por nome, e-mail ou telefone" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | 'todos')}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => setSearch('')}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isLoading ? 'Carregando leads...' : `Leads encontrados (${data?.total ?? 0})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.data?.length ? (
            <LeadsTable leads={data.data} onOpenLead={(lead) => setSelectedLeadId(lead.led_id)} />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum lead encontrado com os filtros atuais.</p>
          )}
        </CardContent>
      </Card>

      <LeadDrawer
        lead={leadDetails.data ?? null}
        open={Boolean(selectedLeadId && leadDetails.data)}
        onOpenChange={(open) => {
          if (!open) setSelectedLeadId(null);
        }}
      />
    </div>
  );
};
