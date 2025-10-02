export type LeadStatus =
  | 'novo'
  | 'qualificado'
  | 'interessado'
  | 'negociacao'
  | 'follow_up'
  | 'ganho'
  | 'perdido';

export interface LeadMessage {
  msg_id: number;
  msg_direcao: 'in' | 'out';
  msg_conteudo: string;
  msg_recebido_em: string;
}

export interface Lead {
  led_id: number;
  led_nome: string;
  led_email?: string;
  led_telefone?: string;
  led_status: LeadStatus;
  led_status_conf: number;
  led_valor_total?: number | null;
  led_responsavel_usrid?: number | null;
  mensagens?: LeadMessage[];
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
}

export interface DashboardMetrics {
  kpis: {
    total_leads: number;
    atualizacoes_ia: number;
    atualizacoes_humano: number;
    auto_rate: number;
    sla_alertas: number;
  };
  funil: Record<LeadStatus, number>;
  serie_diaria: Array<{ dia: string; total: number }>;
  top_objecoes: Array<{ obj: string; total: number }>;
}

export interface InstanciaWhatsapp {
  iwh_id: number;
  iwh_nome: string;
  iwh_status: string;
  iwh_api_key?: string;
  iwh_webhook_token?: string;
}

export interface ContaResumo {
  cta_id: number;
  cta_nome: string;
  cta_slug: string;
  cta_plano_tipo: string;
  usuarios_count: number;
  instancias_whatsapp_count: number;
  leads_count: number;
}
