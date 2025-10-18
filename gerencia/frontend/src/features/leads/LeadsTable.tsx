import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import type { Lead } from '@/types';
import { Button } from '@/components/ui/button';

interface LeadsTableProps {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const LeadsTable = ({ leads, onOpenLead }: LeadsTableProps) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Lead</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Confiança</TableHeaderCell>
          <TableHeaderCell>Valor negociado</TableHeaderCell>
          <TableHeaderCell>Responsável</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {leads.map((lead) => {
          const rawValor = lead.led_valor_total as number | string | null | undefined;
          const valorNumerico = rawValor !== null && rawValor !== undefined ? Number(rawValor) : null;
          const valorFormatado = valorNumerico !== null && Number.isFinite(valorNumerico)
            ? formatCurrency(valorNumerico)
            : 'N�o informado';

          const responsavelLabel =
            lead.responsavel?.usr_nome ??
            (lead.led_responsavel_usrid ? `Usuário #${lead.led_responsavel_usrid}` : 'Não atribuído');

          return (
            <TableRow key={lead.led_id}>
              <TableCell>
                <div className="font-medium text-foreground">{lead.led_nome}</div>
                <div className="text-xs text-muted-foreground">{lead.led_email ?? 'Sem e-mail'}</div>
              </TableCell>
              <TableCell>
                <StatusBadge status={lead.led_status} />
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground">{Math.round((lead.led_status_conf ?? 0) * 100)}%</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground">{valorFormatado}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-subtle">{responsavelLabel}</span>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => onOpenLead(lead)}>
                  Detalhes
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
