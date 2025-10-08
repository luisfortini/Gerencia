import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminContas, useAdminOverview, useEvolutionConfig, useUpdateEvolutionConfig } from "@/hooks/useAdmin";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";

export const AdminGlobalPage = () => {
  const isSuperAdmin = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const raw = localStorage.getItem("gerencia_usuario");
    if (!raw) {
      return false;
    }

    try {
      const parsed = JSON.parse(raw) as { superadmin?: boolean; admin?: boolean } | null;
      return parsed?.superadmin === true;
    } catch (error) {
      console.warn("Nao foi possivel interpretar os dados do usuario.", error);
      return false;
    }
  }, []);

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: overview } = useAdminOverview();
  const { data: contas } = useAdminContas();
  const evolutionConfig = useEvolutionConfig();
  const updateEvolutionConfig = useUpdateEvolutionConfig();

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [verifySsl, setVerifySsl] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (evolutionConfig.data) {
      setBaseUrl(evolutionConfig.data.base_url ?? "");
      setApiKey(evolutionConfig.data.api_key ?? "");
      setVerifySsl(evolutionConfig.data.verify_ssl);
    }
  }, [evolutionConfig.data?.base_url, evolutionConfig.data?.api_key, evolutionConfig.data?.verify_ssl]);

  const handleEvolutionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    const normalizedUrl = baseUrl.trim();
    const normalizedKey = apiKey.trim();

    try {
      await updateEvolutionConfig.mutateAsync({
        base_url: normalizedUrl,
        api_key: normalizedKey === "" ? null : normalizedKey,
        verify_ssl: verifySsl,
      });
      setFeedback({ type: "success", message: "Configurações atualizadas com sucesso." });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? "Não foi possível salvar as configurações.";
      setFeedback({ type: "error", message });
    }
  };

  const handleResetEvolutionUrl = async () => {
    const fallback = evolutionConfig.data?.default_base_url?.trim();
    if (!fallback) {
      return;
    }

    setBaseUrl(fallback);
    try {
      await updateEvolutionConfig.mutateAsync({
        base_url: fallback,
        verify_ssl: verifySsl,
      });
      setFeedback({ type: "success", message: "URL restaurada para o padrão." });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? "Não foi possível restaurar a URL padrão.";
      setFeedback({ type: "error", message });
    }
  };

  const handleClearApiKey = async () => {
    try {
      await updateEvolutionConfig.mutateAsync({ api_key: null, verify_ssl: verifySsl });
      setApiKey("");
      setFeedback({ type: "success", message: "API key removida. Configure uma nova antes de criar instâncias." });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? "Não foi possível remover a API key.";
      setFeedback({ type: "error", message });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração Evolution API</CardTitle>
          <CardDescription>Gerencie rapidamente a URL, a API key e a verificação SSL utilizadas nas integrações.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEvolutionSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-subtle">URL base</label>
              <Input
                required
                type="url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://evolutionapi.seudominio.com"
              />
              {evolutionConfig.data?.default_base_url && (
                <p className="text-xs text-muted-foreground">Padrão sugerido: {evolutionConfig.data.default_base_url}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-subtle">API key</label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Cole a API key fornecida pela Evolution"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setShowApiKey((prev) => !prev)}>
                  {showApiKey ? "Ocultar" : "Mostrar"}
                </Button>
                <Button type="button" variant="outline" onClick={handleClearApiKey} disabled={apiKey === ""}>
                  Remover
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A chave é compartilhada com todas as instâncias. Ela será injetada automaticamente quando um cliente criar uma
                nova conexão.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="verify-ssl"
                type="checkbox"
                checked={verifySsl}
                onChange={(event) => setVerifySsl(event.target.checked)}
                className="h-4 w-4 rounded border border-border"
              />
              <label htmlFor="verify-ssl" className="text-sm text-foreground">
                Verificar certificado SSL nas chamadas para a Evolution
              </label>
            </div>

            {feedback && (
              <p className={`text-xs ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>{feedback.message}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={updateEvolutionConfig.isPending || evolutionConfig.isLoading}>
                {updateEvolutionConfig.isPending ? "Salvando..." : "Salvar configurações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetEvolutionUrl}
                disabled={updateEvolutionConfig.isPending || !evolutionConfig.data?.default_base_url}
              >
                Restaurar URL padrão
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
                    <div className="font-medium text-foreground">{conta.cta_nome}</div>
                    <div className="text-xs text-muted-foreground">slug: {conta.cta_slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={conta.cta_plano_tipo === "anual" ? "success" : "outline"}>
                      {conta.cta_plano_tipo === "anual" ? "Anual" : "Mensal"}
                    </Badge>
                  </TableCell>
                  <TableCell>{conta.usuarios_count}</TableCell>
                  <TableCell>{conta.instancias_whatsapp_count}</TableCell>
                  <TableCell>{conta.leads_count}</TableCell>
                </TableRow>
              )) ?? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
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
  <div className="rounded-lg border border-border bg-surface p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
    <p className="mt-1 text-2xl font-semibold text-foreground">{valor}</p>
  </div>
);
