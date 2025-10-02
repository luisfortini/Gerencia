import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminContas, useAdminOverview } from '@/hooks/useAdmin';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const AdminGlobalPage = () => {
  const { data: overview } = useAdminOverview();
  const { data: contas } = useAdminContas();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo SaaS</CardTitle>
          <CardDescription>Acompanhe o desempenho das contas clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <ResumoItem titulo="Contas" valor={overview?.contas ?? 0} />
            <ResumoItem titulo="Usuários" valor={overview?.usuarios ?? 0} />
            <ResumoItem titulo="Instâncias" valor={overview?.instancias ?? 0} />
            <ResumoItem titulo="Leads" valor={overview?.leads ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contas ativas</CardTitle>
          <CardDescription>Visão geral do uso por cliente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Conta</TableHeaderCell>
                <TableHeaderCell>Plano</TableHeaderCell>
                <TableHeaderCell>Usuários</TableHeaderCell>
                <TableHeaderCell>Instâncias</TableHeaderCell>
                <TableHeaderCell>Leads</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contas?.map((conta) => (
                <TableRow key={conta.cta_id}>
                  <TableCell>
                    <div className="font-medium text-gray-800">{conta.cta_nome}</div>
                    <div className="text-xs text-gray-500">slug: {conta.cta_slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={conta.cta_plano_tipo === 'anual' ? 'success' : 'outline'}>
                      {conta.cta_plano_tipo === 'anual' ? 'Anual' : 'Mensal'}
                    </Badge>
                  </TableCell>
                  <TableCell>{conta.usuarios_count}</TableCell>
                  <TableCell>{conta.instancias_whatsapp_count}</TableCell>
                  <TableCell>{conta.leads_count}</TableCell>
                </TableRow>
              )) ?? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                    Nenhuma conta cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const ResumoItem = ({ titulo, valor }: { titulo: string; valor: number }) => (
  <div className="rounded-lg border border-border bg-white p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500">{titulo}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{valor}</p>
  </div>
);
