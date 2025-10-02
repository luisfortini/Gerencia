import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateInstancia, useInstancias } from '@/hooks/useInstancias';
import type { InstanciaWhatsapp } from '@/types';
import { Badge } from '@/components/ui/badge';

const envLimite =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_INSTANCIAS_LIMITE) ||
  (typeof process !== 'undefined' ? process.env?.VITE_INSTANCIAS_LIMITE : undefined);
const INSTANCIA_LIMITE = Number(envLimite ?? 3);

export const InstanciasPage = () => {
  const { data: instancias = [], isLoading } = useInstancias();
  const createInstancia = useCreateInstancia();
  const [form, setForm] = useState({ iwh_nome: '', iwh_api_key: '', iwh_webhook_token: '' });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createInstancia.mutateAsync(form);
    setForm({ iwh_nome: '', iwh_api_key: '', iwh_webhook_token: '' });
  };

  const limiteAtingido = instancias.length >= INSTANCIA_LIMITE;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Instâncias WhatsApp</CardTitle>
          <CardDescription>
            Conecte contas do WhatsApp para que a IA processe mensagens automaticamente. Limite atual: {INSTANCIA_LIMITE} instâncias.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-gray-500">Carregando instâncias...</p>
            ) : instancias.length ? (
              instancias.map((instancia: InstanciaWhatsapp) => (
                <div key={instancia.iwh_id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{instancia.iwh_nome}</p>
                      <p className="text-xs text-gray-500">Token: {instancia.iwh_webhook_token ?? '---'}</p>
                    </div>
                    <Badge variant={instancia.iwh_status === 'ativo' ? 'success' : 'outline'}>{instancia.iwh_status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Nenhuma instância cadastrada ainda.</p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              required
              placeholder="Nome da instância"
              value={form.iwh_nome}
              onChange={(event) => setForm((prev) => ({ ...prev, iwh_nome: event.target.value }))}
            />
            <Input
              required
              placeholder="API Key Evolution"
              value={form.iwh_api_key}
              onChange={(event) => setForm((prev) => ({ ...prev, iwh_api_key: event.target.value }))}
            />
            <Input
              required
              placeholder="Token do webhook"
              value={form.iwh_webhook_token}
              onChange={(event) => setForm((prev) => ({ ...prev, iwh_webhook_token: event.target.value }))}
            />
            <Button type="submit" disabled={limiteAtingido || createInstancia.isPending}>
              {limiteAtingido ? 'Limite de instâncias atingido' : 'Conectar Instância'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
