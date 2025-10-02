import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@/types';

const statusColor: Record<LeadStatus, 'default' | 'success' | 'warning' | 'destructive' | 'outline'> = {
  novo: 'outline',
  qualificado: 'default',
  interessado: 'default',
  negociacao: 'warning',
  follow_up: 'outline',
  ganho: 'success',
  perdido: 'destructive',
};

const statusLabel: Record<LeadStatus, string> = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  interessado: 'Interessado',
  negociacao: 'Negociação',
  follow_up: 'Follow-up',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export const StatusBadge = ({ status }: { status: LeadStatus }) => (
  <Badge variant={statusColor[status]}>{statusLabel[status]}</Badge>
);
