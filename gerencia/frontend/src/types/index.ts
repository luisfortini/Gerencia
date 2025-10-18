export type LeadStatus =
  | "novo"
  | "qualificado"
  | "interessado"
  | "negociação"
  | "follow_up"
  | "ganho"
  | "perdido";

export interface LeadMessage {
  msg_id: number;
  msg_direcao: "in" | "out";
  msg_conteudo: string;
  msg_recebido_em: string;
}

export interface LeadResponsavel {
  usr_id: number;
  usr_nome: string;
  usr_email?: string | null;
  usr_papel?: string | null;
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
  responsavel?: LeadResponsavel | null;
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
  cta_plano_tipo: 'mensal' | 'anual';
  cta_limite_instancias: number;
  cta_limite_usuarios: number;
  cta_retencao_dias: number;
  cta_status: 'ativo' | 'inativo';
  cta_observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
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

export interface DashboardSettings {
  metaPrimeiraRespostaMin: number;
  defaultMetaPrimeiraRespostaMin: number;
}

export interface Usuario {
  usr_id: number;
  usr_nome: string;
  usr_email: string;
  usr_papel: "gestor" | "operador";
  usr_admin: boolean;
  usr_ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UsuariosResponse {
  usuarios: Usuario[];
  limite: number;
  total_ativos: number;
  disponiveis: number | null;
}

export interface UsuarioOption {
  id: number;
  nome: string;
  email?: string | null;
  papel?: string | null;
  admin: boolean;
}
