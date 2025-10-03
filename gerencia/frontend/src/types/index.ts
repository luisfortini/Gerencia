export type LeadStatus =
  | "novo"
  | "qualificado"
  | "interessado"
  | "negociacao"
  | "follow_up"
  | "ganho"
  | "perdido";

export interface LeadMessage {
  msg_id: number;
  msg_direcao: "in" | "out";
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

export interface EvolutionQrCode {
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
}

export interface EvolutionMetadata {
  instance_name?: string;
  instance_id?: string;
  token?: string;
  integration?: string;
  status?: string;
  last_qr?: EvolutionQrCode | null;
  missing_at?: string;
}

export interface InstanciaMetadata {
  evolution?: EvolutionMetadata;
  phone_number?: string;
  phone_number_raw?: string;
  phone_number_is_international?: boolean;
  [key: string]: unknown;
}

export interface InstanciaWhatsapp {
  iwh_id: number;
  iwh_nome: string;
  iwh_status: string;
  iwh_api_key?: string;
  iwh_webhook_token?: string;
  iwh_metadata?: InstanciaMetadata;
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

export interface EvolutionConfig {
  base_url: string;
  default_base_url: string;
  api_key?: string | null;
  verify_ssl: boolean;
  default_verify_ssl: boolean;
}
