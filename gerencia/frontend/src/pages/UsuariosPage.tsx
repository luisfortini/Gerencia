import { FormEvent, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { useCreateUsuario, useDeleteUsuario, useUpdateUsuario, useUsuarios } from '@/hooks/useUsuarios';
import type { Usuario } from '@/types';
import { Loader2, Pencil, Plus, Trash2, UserMinus, UserPlus } from 'lucide-react';

type FormState = {
  nome: string;
  email: string;
  senha: string;
  papel: 'gestor' | 'operador';
  admin: boolean;
  ativo: boolean;
};

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const defaultFormState: FormState = {
  nome: '',
  email: '',
  senha: '',
  papel: 'operador',
  admin: false,
  ativo: true,
};

const parseStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem('gerencia_usuario');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as {
      id?: number;
      admin?: boolean;
      superadmin?: boolean;
    };
  } catch (error) {
    console.warn('Nao foi possivel interpretar os dados armazenados do usuario.', error);
    return null;
  }
};

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error && error.response) {
    const response = (error as any).response;
    if (response?.data?.message && typeof response.data.message === 'string') {
      return response.data.message as string;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const UsuariosPage = () => {
  const storedUser = useMemo(() => parseStoredUser(), []);
  const currentUserId = storedUser?.id ?? null;
  const isSuperAdmin = storedUser?.superadmin === true;
  const isAdmin = storedUser?.admin === true || isSuperAdmin;
  const canManageUsuarios = isAdmin || isSuperAdmin;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [modalFeedback, setModalFeedback] = useState<FeedbackState>(null);
  const [globalFeedback, setGlobalFeedback] = useState<FeedbackState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const usuariosQuery = useUsuarios({ enabled: canManageUsuarios });
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();

  if (!canManageUsuarios) {
    return <Navigate to="/dashboard" replace />;
  }

  const usuarios = usuariosQuery.data?.usuarios ?? [];
  const limite = usuariosQuery.data?.limite ?? 0;
  const totalAtivos = usuariosQuery.data?.total_ativos ?? 0;
  const disponiveis = usuariosQuery.data?.disponiveis ?? null;
  const isLimitReached = limite > 0 && totalAtivos >= limite;

  const resetModal = () => {
    setIsModalOpen(false);
    setForm(defaultFormState);
    setModalFeedback(null);
    setSelectedUser(null);
    setModalMode('create');
  };

  const openCreateModal = () => {
    setForm(defaultFormState);
    setModalMode('create');
    setSelectedUser(null);
    setModalFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (usuario: Usuario) => {
    setForm({
      nome: usuario.usr_nome,
      email: usuario.usr_email,
      senha: '',
      papel: usuario.usr_papel,
      admin: usuario.usr_admin,
      ativo: usuario.usr_ativo,
    });
    setModalMode('edit');
    setSelectedUser(usuario);
    setModalFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setModalFeedback(null);

    try {
      if (modalMode === 'create') {
        await createUsuario.mutateAsync({
          usr_nome: form.nome.trim(),
          usr_email: form.email.trim(),
          usr_senha: form.senha,
          usr_papel: form.papel,
          usr_admin: form.admin,
          usr_ativo: form.ativo,
        });
        setGlobalFeedback({ type: 'success', message: 'Usuario criado com sucesso.' });
      } else if (selectedUser) {
        const payload: Record<string, unknown> = {
          usr_nome: form.nome.trim(),
          usr_email: form.email.trim(),
          usr_papel: form.papel,
          usr_admin: form.admin,
          usr_ativo: form.ativo,
        };

        if (form.senha.trim() !== '') {
          payload.usr_senha = form.senha;
        }

        await updateUsuario.mutateAsync({ id: selectedUser.usr_id, payload });
        setGlobalFeedback({ type: 'success', message: 'Usuario atualizado com sucesso.' });
      }

      resetModal();
    } catch (error) {
      setModalFeedback({
        type: 'error',
        message: resolveErrorMessage(error, 'Nao foi possivel salvar o usuario. Verifique os dados e tente novamente.'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAtivo = async (usuario: Usuario) => {
    if (usuario.usr_id === currentUserId && usuario.usr_admin) {
      setGlobalFeedback({ type: 'error', message: 'Nao e possivel desativar o proprio usuario administrador.' });
      return;
    }

    setTogglingId(usuario.usr_id);
    setGlobalFeedback(null);
    try {
      await updateUsuario.mutateAsync({
        id: usuario.usr_id,
        payload: { usr_ativo: !usuario.usr_ativo },
      });
      setGlobalFeedback({
        type: 'success',
        message: !usuario.usr_ativo ? 'Usuario reativado com sucesso.' : 'Usuario desativado com sucesso.',
      });
    } catch (error) {
      setGlobalFeedback({
        type: 'error',
        message: resolveErrorMessage(error, 'Nao foi possivel atualizar o status do usuario.'),
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (usuario: Usuario) => {
    if (usuario.usr_id === currentUserId) {
      setGlobalFeedback({ type: 'error', message: 'Voce nao pode excluir seu proprio usuario.' });
      return;
    }

    const confirmation = window.confirm(`Deseja realmente excluir o usuario ${usuario.usr_nome}?`);
    if (!confirmation) {
      return;
    }

    setDeletingId(usuario.usr_id);
    setGlobalFeedback(null);

    try {
      await deleteUsuario.mutateAsync(usuario.usr_id);
      setGlobalFeedback({ type: 'success', message: 'Usuario excluido com sucesso.' });
    } catch (error) {
      setGlobalFeedback({
        type: 'error',
        message: resolveErrorMessage(error, 'Nao foi possivel excluir o usuario selecionado.'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderStatusBadge = (usuario: Usuario) => {
    if (!usuario.usr_ativo) {
      return <Badge variant="outline">Inativo</Badge>;
    }

    return <Badge variant="success">Ativo</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Usuarios da conta</CardTitle>
            <CardDescription>Gerencie quem tem acesso ao painel e defina as permissoes de cada membro.</CardDescription>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                Ativos: <strong>{totalAtivos}</strong>
                {limite > 0 ? (
                  <>
                    {' '}
                    de <strong>{limite}</strong>
                  </>
                ) : null}
              </span>
              {disponiveis !== null ? (
                <Badge variant={isLimitReached ? 'outline' : 'success'}>
                  {isLimitReached ? 'Limite atingido' : `${disponiveis} vagas disponiveis`}
                </Badge>
              ) : (
                <Badge variant="outline">Sem limite definido</Badge>
              )}
            </div>
            <Button
              type="button"
              onClick={openCreateModal}
              disabled={isLimitReached || isSaving}
              title={isLimitReached ? 'Limite de usuarios ativos atingido.' : undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {globalFeedback ? (
            <p className={`text-sm ${globalFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {globalFeedback.message}
            </p>
          ) : null}

          {usuariosQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando usuarios...
            </div>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuario cadastrado para esta conta ainda.</p>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>E-mail</TableHeaderCell>
                  <TableHeaderCell>Papel</TableHeaderCell>
                  <TableHeaderCell>Perfil</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Acoes</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((usuario) => {
                  const isCurrentUser = usuario.usr_id === currentUserId;
                  const isProcessing = togglingId === usuario.usr_id || deletingId === usuario.usr_id;

                  return (
                    <TableRow key={usuario.usr_id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{usuario.usr_nome}</div>
                        <div className="text-xs text-muted-foreground">ID: {usuario.usr_id}</div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{usuario.usr_email}</TableCell>
                      <TableCell className="capitalize text-sm text-foreground">{usuario.usr_papel}</TableCell>
                      <TableCell>
                        {usuario.usr_admin ? <Badge variant="success">Administrador</Badge> : <Badge variant="outline">Operacional</Badge>}
                      </TableCell>
                      <TableCell>{renderStatusBadge(usuario)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(usuario)}
                            disabled={isProcessing}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAtivo(usuario)}
                            disabled={isProcessing}
                            title={
                              isCurrentUser && usuario.usr_admin
                                ? 'Nao e possivel desativar seu proprio usuario administrador.'
                                : undefined
                            }
                          >
                            {togglingId === usuario.usr_id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : usuario.usr_ativo ? (
                              <UserMinus className="mr-1 h-4 w-4" />
                            ) : (
                              <UserPlus className="mr-1 h-4 w-4" />
                            )}
                            {usuario.usr_ativo ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-600"
                            onClick={() => handleDelete(usuario)}
                            disabled={isProcessing || isCurrentUser}
                            title={isCurrentUser ? 'Voce nao pode excluir o proprio usuario.' : undefined}
                          >
                            {deletingId === usuario.usr_id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-1 h-4 w-4" />
                            )}
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsModalOpen(true);
          } else {
            resetModal();
          }
        }}
        title={modalMode === 'create' ? 'Novo usuario' : `Editar usuario${selectedUser ? `: ${selectedUser.usr_nome}` : ''}`}
        description={
          modalMode === 'create'
            ? 'Cadastre um novo usuario da conta. Defina se ele deve ter perfil administrador para gerenciar integrações e equipe.'
            : 'Atualize os dados, permissoes e senha do usuario selecionado.'
        }
        footer={
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={resetModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="usuario-form"
              disabled={isSaving || (modalMode === 'create' && form.senha.trim().length < 8)}
            >
              {isSaving ? 'Salvando...' : modalMode === 'create' ? 'Criar usuario' : 'Salvar alteracoes'}
            </Button>
          </div>
        }
      >
        <form id="usuario-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="usuario-nome">
              Nome completo
            </label>
            <Input
              id="usuario-nome"
              value={form.nome}
              onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
              required
              placeholder="Nome do usuario"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="usuario-email">
              E-mail
            </label>
            <Input
              id="usuario-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
              placeholder="usuario@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="usuario-papel">
              Papel
            </label>
            <Select
              id="usuario-papel"
              value={form.papel}
              onChange={(event) => setForm((prev) => ({ ...prev, papel: event.target.value as FormState['papel'] }))}
            >
              <option value="gestor">Gestor</option>
              <option value="operador">Operador</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="usuario-admin"
              type="checkbox"
              checked={form.admin}
              onChange={(event) => setForm((prev) => ({ ...prev, admin: event.target.checked }))}
              className="h-4 w-4 rounded border border-border"
            />
            <label className="text-sm text-foreground" htmlFor="usuario-admin">
              Conceder acesso administrador (pode gerenciar integrações e usuarios)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="usuario-ativo"
              type="checkbox"
              checked={form.ativo}
              onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.checked }))}
              className="h-4 w-4 rounded border border-border"
            />
            <label className="text-sm text-foreground" htmlFor="usuario-ativo">
              Usuario ativo (contabiliza no limite da conta)
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="usuario-senha">
              {modalMode === 'create' ? 'Senha inicial' : 'Nova senha (opcional)'}
            </label>
            <Input
              id="usuario-senha"
              type="password"
              value={form.senha}
              onChange={(event) => setForm((prev) => ({ ...prev, senha: event.target.value }))}
              placeholder={modalMode === 'create' ? 'Minimo de 8 caracteres' : 'Informe para redefinir a senha'}
              required={modalMode === 'create'}
              minLength={modalMode === 'create' ? 8 : undefined}
            />
            <p className="text-xs text-muted-foreground">
              Para novos usuarios, compartilhe a senha com segurança e recomende que alterem no primeiro acesso.
            </p>
          </div>
          {modalFeedback ? (
            <p className={`text-sm ${modalFeedback.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {modalFeedback.message}
            </p>
          ) : null}
        </form>
      </Modal>
    </div>
  );
};

export default UsuariosPage;

