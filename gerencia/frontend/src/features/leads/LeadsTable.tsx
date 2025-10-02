import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import type { Lead } from '@/types';
import { Button } from '@/components/ui/button';

interface LeadsTableProps {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
}

export const LeadsTable = ({ leads, onOpenLead }: LeadsTableProps) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Lead</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Confiança</TableHeaderCell>
          <TableHeaderCell>Responsável</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.led_id}>
            <TableCell>
              <div className="font-medium text-gray-900">{lead.led_nome}</div>
              <div className="text-xs text-gray-500">{lead.led_email ?? 'Sem e-mail'}</div>
            </TableCell>
            <TableCell>
              <StatusBadge status={lead.led_status} />
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-700">{Math.round((lead.led_status_conf ?? 0) * 100)}%</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">{lead.led_responsavel_usrid ? `Usuário #${lead.led_responsavel_usrid}` : 'Não atribuído'}</span>
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onOpenLead(lead)}>
                Abrir
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
