import { useEffect, useMemo, useState } from "react";

import { isAxiosError } from "axios";

import type { ContaResumo } from "@/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {

  useAdminContas,

  useAdminOverview,

  useEvolutionConfig,

  useUpdateEvolutionConfig,

  useCreateConta,

  useUpdateConta,

  useDeleteConta,

} from "@/hooks/useAdmin";

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Select } from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import { Modal } from "@/components/ui/modal";

import { Navigate } from "react-router-dom";



type FeedbackState = { type: "success" | "error"; message: string } | null;



type ContaFormState = {

  nome: string;

  slug: string;

  plano: "mensal" | "anual";

  limiteInstancias: string;

  limiteUsuarios: string;

  retencaoDias: string;

  status: "ativo" | "inativo";

  observacoes: string;

};



const createDefaultContaForm = (): ContaFormState => ({

  nome: "",

  slug: "",

  plano: "mensal",

  limiteInstancias: "1",

  limiteUsuarios: "1",

  retencaoDias: "30",

  status: "ativo",

  observacoes: "",

});



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

      console.warn("Não foi possível interpretar os dados do usuário.", error);

      return false;

    }

  }, []);



  if (!isSuperAdmin) {

    return <Navigate to="/dashboard" replace />;

  }



  const { data: overview } = useAdminOverview();

  const contasQuery = useAdminContas();

  const contas = contasQuery.data ?? [];

  const evolutionConfig = useEvolutionConfig();

  const updateEvolutionConfig = useUpdateEvolutionConfig();

  const createContaMutation = useCreateConta();

  const updateContaMutation = useUpdateConta();

  const deleteContaMutation = useDeleteConta();



  const [baseUrl, setBaseUrl] = useState("");

  const [apiKey, setApiKey] = useState("");

  const [verifySsl, setVerifySsl] = useState(true);

  const [showApiKey, setShowApiKey] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [contaModalOpen, setContaModalOpen] = useState(false);

  const [editingContaId, setEditingContaId] = useState<number | null>(null);

  const [contaForm, setContaForm] = useState<ContaFormState>(createDefaultContaForm());

  const [contaModalError, setContaModalError] = useState<string | null>(null);

  const [contaListFeedback, setContaListFeedback] = useState<FeedbackState>(null);

  const [deletingContaId, setDeletingContaId] = useState<number | null>(null);



  useEffect(() => {

    if (evolutionConfig.data) {

      setBaseUrl(evolutionConfig.data.base_url ?? "");

      setApiKey(evolutionConfig.data.api_key ?? "");

      setVerifySsl(evolutionConfig.data.verify_ssl);

    }

  }, [evolutionConfig.data?.base_url, evolutionConfig.data?.api_key, evolutionConfig.data?.verify_ssl]);



  const contasLoading = contasQuery.isLoading;

  const isSavingConta = createContaMutation.isPending || updateContaMutation.isPending;



  const resetContaForm = () => {

    setContaForm(createDefaultContaForm());

    setEditingContaId(null);

    setContaModalError(null);

  };



  const handleCloseContaModal = () => {

    setContaModalOpen(false);

    resetContaForm();

  };



  const handleOpenCreateConta = () => {

    resetContaForm();

    setContaListFeedback(null);

    setContaModalOpen(true);

  };



  const handleOpenEditConta = (conta: ContaResumo) => {

    setContaForm({

      nome: conta.cta_nome ?? "",

      slug: conta.cta_slug ?? "",

      plano: conta.cta_plano_tipo,

      limiteInstancias: String(conta.cta_limite_instancias ?? 1),

      limiteUsuarios: String(conta.cta_limite_usuarios ?? 1),

      retencaoDias: String(conta.cta_retencao_dias ?? 30),

      status: conta.cta_status ?? "ativo",

      observacoes: conta.cta_observacoes ?? "",

    });

    setEditingContaId(conta.cta_id);

    setContaModalError(null);

    setContaListFeedback(null);

    setContaModalOpen(true);

  };



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

  const handleContaChange = (field: keyof ContaFormState, value: string) => {

    setContaForm((prev) => ({ ...prev, [field]: value }));

  };



  const toPositiveInt = (value: string, fallback: number) => {

    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;

  };



  const handleContaSubmit = async (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    setContaModalError(null);



    const nome = contaForm.nome.trim();

    const slug = contaForm.slug.trim();



    if (!nome) {

      setContaModalError("Informe o nome da conta.");

      return;

    }



    if (!slug) {

      setContaModalError("Informe o slug da conta.");

      return;

    }



    const payload = {

      cta_nome: nome,

      cta_slug: slug,

      cta_plano_tipo: contaForm.plano,

      cta_limite_instancias: toPositiveInt(contaForm.limiteInstancias, 1),

      cta_limite_usuarios: toPositiveInt(contaForm.limiteUsuarios, 1),

      cta_retencao_dias: toPositiveInt(contaForm.retencaoDias, 30),

      cta_status: contaForm.status,

      cta_observacoes: contaForm.observacoes.trim() === "" ? null : contaForm.observacoes.trim(),

    };



    try {

      if (editingContaId === null) {

        await createContaMutation.mutateAsync(payload);

        setContaListFeedback({ type: "success", message: "Conta criada com sucesso." });

      } else {

        await updateContaMutation.mutateAsync({ id: editingContaId, payload });

        setContaListFeedback({ type: "success", message: "Conta atualizada com sucesso." });

      }



      handleCloseContaModal();

    } catch (error) {

      const message = isAxiosError(error)

        ? error.response?.data?.message ?? error.message

        : "Não foi possível salvar a conta.";

      setContaModalError(typeof message === "string" ? message : "Não foi possível salvar a conta.");

    }

  };



  const handleDeleteConta = async (conta: ContaResumo) => {

    const confirmed = window.confirm(

      `Deseja realmente remover a conta "${conta.cta_nome}"? Esta ação é irreversível.`

    );



    if (!confirmed) {

      return;

    }



    setDeletingContaId(conta.cta_id);

    setContaListFeedback(null);



    try {

      await deleteContaMutation.mutateAsync(conta.cta_id);

      setContaListFeedback({ type: "success", message: "Conta removida com sucesso." });

    } catch (error) {

      const message = isAxiosError(error)

        ? error.response?.data?.message ?? error.message

        : "Não foi possível remover a conta.";

      setContaListFeedback({

        type: "error",

        message: typeof message === "string" ? message : "Não foi possível remover a conta.",

      });

    } finally {

      setDeletingContaId(null);

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

        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <CardTitle>Contas</CardTitle>

            <CardDescription>Cadastre, edite ou inative contas clientes.</CardDescription>

          </div>

          <Button type="button" onClick={handleOpenCreateConta} disabled={isSavingConta}>

            Nova conta

          </Button>

        </CardHeader>

        <CardContent className="space-y-4">

          {contaListFeedback ? (

            <p className={`text-sm ${contaListFeedback.type === "error" ? "text-red-600" : "text-green-600"}`}>

              {contaListFeedback.message}

            </p>

          ) : null}



          {contasLoading ? <p className="text-sm text-muted-foreground">Carregando contas cadastradas...</p> : null}



          {!contasLoading && contas.length === 0 ? (

            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada até o momento.</p>

          ) : null}



          {contas.length > 0 ? (

            <Table>

              <TableHead>

                <TableRow>

                  <TableHeaderCell>Conta</TableHeaderCell>

                  <TableHeaderCell>Plano / Status</TableHeaderCell>

                  <TableHeaderCell>Limites</TableHeaderCell>

                  <TableHeaderCell>Uso atual</TableHeaderCell>

                  <TableHeaderCell>Ações</TableHeaderCell>

                </TableRow>

              </TableHead>

              <TableBody>

                {contas.map((conta) => {

                  const isDeleting = deletingContaId === conta.cta_id && deleteContaMutation.isPending;



                  return (

                    <TableRow key={conta.cta_id}>

                      <TableCell>

                        <div className="font-medium text-foreground">{conta.cta_nome}</div>

                        <div className="text-xs text-muted-foreground">slug: {conta.cta_slug}</div>

                        {conta.cta_observacoes ? (

                          <p className="mt-1 text-xs text-muted-foreground">{conta.cta_observacoes}</p>

                        ) : null}

                      </TableCell>

                      <TableCell>

                        <div className="flex flex-wrap items-center gap-2">

                          <Badge variant={conta.cta_plano_tipo === "anual" ? "success" : "outline"}>

                            {conta.cta_plano_tipo === "anual" ? "Anual" : "Mensal"}

                          </Badge>

                          <Badge variant={conta.cta_status === "ativo" ? "success" : "outline"}>

                            {conta.cta_status === "ativo" ? "Ativo" : "Inativo"}

                          </Badge>

                        </div>

                      </TableCell>

                      <TableCell>

                        <div className="text-sm text-foreground">

                          {conta.cta_limite_instancias} instâncias

                        </div>

                        <div className="text-sm text-foreground">

                          {conta.cta_limite_usuarios} usuários

                        </div>

                        <div className="text-xs text-muted-foreground">

                          Retenção: {conta.cta_retencao_dias} dias

                        </div>

                      </TableCell>

                      <TableCell>

                        <div className="text-sm text-foreground">{conta.usuarios_count} usuários</div>

                        <div className="text-sm text-foreground">{conta.instancias_whatsapp_count} instâncias</div>

                        <div className="text-sm text-foreground">{conta.leads_count} leads</div>

                      </TableCell>

                      <TableCell>

                        <div className="flex flex-wrap gap-2">

                          <Button

                            type="button"

                            size="sm"

                            variant="outline"

                            onClick={() => handleOpenEditConta(conta)}

                            disabled={isSavingConta || isDeleting}

                          >

                            Editar

                          </Button>

                          <Button

                            type="button"

                            size="sm"

                            variant="ghost"

                            className="text-red-600 hover:text-red-600"

                            onClick={() => handleDeleteConta(conta)}

                            disabled={isDeleting || isSavingConta}

                          >

                            {isDeleting ? "Removendo..." : "Excluir"}

                          </Button>

                        </div>

                      </TableCell>

                    </TableRow>

                  );

                })}

              </TableBody>

            </Table>

          ) : null}

        </CardContent>

      </Card>



      <Modal

        open={contaModalOpen}

        onOpenChange={(open) => {

          if (!open) {

            handleCloseContaModal();

          } else {

            setContaModalOpen(true);

          }

        }}

        title={editingContaId === null ? "Nova conta" : "Editar conta"}

        description="Defina o plano, limites e status da conta."

        footer={

          <div className="flex gap-2">

            <Button type="button" variant="ghost" onClick={handleCloseContaModal} disabled={isSavingConta}>

              Cancelar

            </Button>

            <Button type="submit" form="conta-form" disabled={isSavingConta}>

              {isSavingConta ? "Salvando..." : editingContaId === null ? "Criar conta" : "Salvar alterações"}

            </Button>

          </div>

        }

      >

        <form id="conta-form" className="space-y-4" onSubmit={handleContaSubmit}>

          <div className="grid gap-3 md:grid-cols-2">

            <div className="space-y-1">

              <label className="text-xs font-medium text-subtle" htmlFor="conta-nome">

                Nome da conta

              </label>

              <Input

                id="conta-nome"

                value={contaForm.nome}

                onChange={(event) => handleContaChange("nome", event.target.value)}

                required

              />

            </div>

            <div className="space-y-1">

              <label className="text-xs font-medium text-subtle" htmlFor="conta-slug">

                Slug

              </label>

              <Input

                id="conta-slug"

                value={contaForm.slug}

                onChange={(event) => handleContaChange("slug", event.target.value)}

                required

              />

              <p className="text-xs text-muted-foreground">Utilize letras minúsculas e hífens (ex: minha-conta).</p>

            </div>

          </div>



          <div className="grid gap-3 md:grid-cols-2">

            <div className="space-y-1">

              <label className="text-xs font-medium text-subtle" htmlFor="conta-plano">

                Plano

              </label>

              <Select

                id="conta-plano"

                value={contaForm.plano}

                onChange={(event) => handleContaChange("plano", event.target.value as ContaFormState["plano"])}

              >

                <option value="mensal">Mensal</option>

                <option value="anual">Anual</option>

              </Select>

            </div>

            <div className="space-y-1">

              <label className="text-xs font-medium text-subtle" htmlFor="conta-status">

                Status

              </label>

              <Select

                id="conta-status"

                value={contaForm.status}

                onChange={(event) => handleContaChange("status", event.target.value as ContaFormState["status"])}

              >

                <option value="ativo">Ativo</option>

                <option value="inativo">Inativo</option>

              </Select>

            </div>

          </div>



          <div className="grid gap-3 md:grid-cols-3">

            <div className="space-y-1">

              <label className="text-xs font-medium text-subtle" htmlFor="conta-limite-usuarios">

                Limite de instâncias

              </label>

              <Input

                id="conta-limite-usuarios"

                type="number"

                min={1}

                value={contaForm.limiteInstancias}

                onChange={(event) => handleContaChange("limiteInstâncias", event.target.value)}

                required

              />

            </div>

            <div className="space-y-1">

              <label className="text-xs font-medium text-subtle" htmlFor="conta-limite-usuários">

                Limite de usuários

              </label>

              <Input

                id="conta-limite-usuários"

                type="number"

                min={1}

                value={contaForm.limiteUsuarios}

                onChange={(event) => handleContaChange("limiteUsuários", event.target.value)}

                required

              />

            </div>

            <div className="space-y-1">

              <label className="text-xs font-medium text-subtle" htmlFor="conta-retencao">

                Retenção (dias)

              </label>

              <Input

                id="conta-retencao"

                type="number"

                min={1}

                value={contaForm.retencaoDias}

                onChange={(event) => handleContaChange("retençãoDias", event.target.value)}

                required

              />

            </div>

          </div>



          <div className="space-y-1">

            <label className="text-xs font-medium text-subtle" htmlFor="conta-observacoes">

              Observações

            </label>

            <Textarea

              id="conta-observacoes"

              rows={3}

              value={contaForm.observacoes}

              onChange={(event) => handleContaChange("observações", event.target.value)}

              placeholder="Informações adicionais, notas internas ou particularidades do cliente."

            />

          </div>



          {contaModalError ? <p className="text-sm text-red-600">{contaModalError}</p> : null}

        </form>

      </Modal>

    </div>

  );

};



const ResumoItem = ({ titulo, valor }: { titulo: string; valor: number }) => (

  <div className="rounded-lg border border-border bg-surface p-4">

    <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>

    <p className="mt-1 text-2xl font-semibold text-foreground">{valor}</p>

  </div>

);

