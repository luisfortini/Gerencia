import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useEmpresaSettings, useUpdateEmpresaSettings } from '@/hooks/useContaSettings';

type StoredUsuario = { papel?: string; admin?: boolean; superadmin?: boolean } | null;

const getStoredUser = (): StoredUsuario => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem('gerencia_usuario');

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUsuario;
  } catch (error) {
    console.warn('Nao foi possivel interpretar o usuario armazenado.', error);
    return null;
  }
};

export const ConfiguracoesPage = () => {
  const settingsQuery = useEmpresaSettings();
  const updateSettings = useUpdateEmpresaSettings();
  const [empresaSobre, setEmpresaSobre] = useState('');
  const [empresaProdutos, setEmpresaProdutos] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canEdit = useMemo(() => {
    const user = getStoredUser();
    if (!user) {
      return false;
    }

    return user.papel === 'gestor' || user.admin === true || user.superadmin === true;
  }, []);

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    setEmpresaSobre(settingsQuery.data.empresaSobre ?? '');
    setEmpresaProdutos(settingsQuery.data.empresaProdutos ?? '');
  }, [settingsQuery.data?.empresaSobre, settingsQuery.data?.empresaProdutos]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) {
      setFeedback({ type: 'error', message: 'Somente gestores ou administradores podem editar estas configuracoes.' });
      return;
    }

    setFeedback(null);

    try {
      await updateSettings.mutateAsync({
        empresaSobre,
        empresaProdutos,
      });
      setFeedback({ type: 'success', message: 'Configuracoes salvas com sucesso.' });
    } catch (error) {
      let message = 'Nao foi possivel salvar as configuracoes.';
      if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data?.message;
        if (typeof responseMessage === 'string') {
          message = responseMessage;
        }
      }
      setFeedback({ type: 'error', message });
    }
  };

  const loadErrorMessage = useMemo(() => {
    if (!settingsQuery.isError) {
      return null;
    }

    if (axios.isAxiosError(settingsQuery.error)) {
      const responseMessage = settingsQuery.error.response?.data?.message;
      if (typeof responseMessage === 'string') {
        return responseMessage;
      }
    }

    return 'Nao foi possivel carregar as configuracoes.';
  }, [settingsQuery.error, settingsQuery.isError]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Informe o contexto da empresa para ajudar a IA a interpretar as mensagens dos leads.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Contexto da empresa</CardTitle>
          <CardDescription>
            Estes dados são enviados no prompt da IA para melhorar a classificação do status do lead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="configuracoes-empresa-form" className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="empresa-sobre">
                Sobre a empresa
              </label>
              <Textarea
                id="empresa-sobre"
                value={empresaSobre}
                onChange={(event) => setEmpresaSobre(event.target.value)}
                placeholder="Descreva o que a empresa faz, publico-alvo e diferenciais."
                maxLength={2000}
                disabled={!canEdit || settingsQuery.isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="empresa-produtos">
                Produtos e servicos
              </label>
              <Textarea
                id="empresa-produtos"
                value={empresaProdutos}
                onChange={(event) => setEmpresaProdutos(event.target.value)}
                placeholder="Liste os principais produtos, servicos e ofertas."
                maxLength={2000}
                disabled={!canEdit || settingsQuery.isLoading}
              />
            </div>
            {feedback ? (
              <p className={feedback.type === 'success' ? 'text-sm text-emerald-600' : 'text-sm text-red-500'}>
                {feedback.message}
              </p>
            ) : null}
            {loadErrorMessage ? <p className="text-sm text-red-500">{loadErrorMessage}</p> : null}
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            form="configuracoes-empresa-form"
            disabled={!canEdit || settingsQuery.isLoading || updateSettings.isPending}
          >
            {updateSettings.isPending ? 'Salvando...' : 'Salvar configuracoes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
