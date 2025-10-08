import { Drawer } from '@/components/ui/drawer';
import { StatusBadge } from '@/components/StatusBadge';
import type { Lead } from '@/types';

interface LeadDrawerProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeadDrawer = ({ lead, open, onOpenChange }: LeadDrawerProps) => {
  if (!lead) return null;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={lead.led_nome}
      description={lead.led_email ?? 'Sem e-mail cadastrado'}
    >
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-3">
            <StatusBadge status={lead.led_status} />
            <span className="text-sm text-muted-foreground">Confiança: {Math.round((lead.led_status_conf ?? 0) * 100)}%</span>
          </div>
          <p className="mt-2 text-sm text-subtle">Responsável: {lead.led_responsavel_usrid ? `Usuário #${lead.led_responsavel_usrid}` : 'Não atribuído'}</p>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Últimas mensagens</h3>
          <div className="space-y-3">
            {lead.mensagens?.length ? (
              lead.mensagens.map((msg) => (
                <div key={msg.msg_id} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{msg.msg_direcao === 'in' ? 'Cliente' : 'Equipe'}</span>
                    <span>{new Date(msg.msg_recebido_em).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{msg.msg_conteudo}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem registrada para este lead.</p>
            )}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-foreground">Sugestões da IA</h3>
          <p className="mt-2 text-sm text-subtle">
            Quando a IA processar novas mensagens, as sugestões aparecerão aqui para facilitar a decisão do time.
          </p>
        </section>
      </div>
    </Drawer>
  );
};
