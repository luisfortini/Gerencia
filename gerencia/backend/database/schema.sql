-- Esquema do banco GerencIA (MySQL 8+)

CREATE TABLE IF NOT EXISTS `conta` (
  `cta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cta_nome` varchar(255) NOT NULL,
  `cta_slug` varchar(255) NOT NULL,
  `cta_plano_tipo` enum('mensal','anual') NOT NULL DEFAULT 'mensal',
  `cta_limite_instancias` int NOT NULL DEFAULT 1,
  `cta_retencao_dias` int NOT NULL DEFAULT 30,
  `cta_status` varchar(255) NOT NULL DEFAULT 'ativo',
  `cta_observacoes` text NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`cta_id`),
  UNIQUE KEY `uq_cta_slug` (`cta_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuario` (
  `usr_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `usr_ctaid` bigint unsigned NULL,
  `usr_nome` varchar(255) NOT NULL,
  `usr_email` varchar(255) NOT NULL,
  `usr_senha` varchar(255) NOT NULL,
  `usr_papel` varchar(255) NOT NULL,
  `usr_superadmin` tinyint(1) NOT NULL DEFAULT 0,
  `usr_ativo` tinyint(1) NOT NULL DEFAULT 1,
  `remember_token` varchar(100) NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`usr_id`),
  UNIQUE KEY `uq_usr_email` (`usr_email`),
  CONSTRAINT `fk_usr_cta` FOREIGN KEY (`usr_ctaid`) REFERENCES `conta`(`cta_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `instancia_whatsapp` (
  `iwh_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `iwh_ctaid` bigint unsigned NOT NULL,
  `iwh_nome` varchar(255) NOT NULL,
  `iwh_status` varchar(255) NOT NULL DEFAULT 'ativo',
  `iwh_api_key` varchar(255) NOT NULL,
  `iwh_webhook_token` varchar(255) NOT NULL,
  `iwh_metadata` json NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`iwh_id`),
  UNIQUE KEY `uq_iwh_webhook_token` (`iwh_webhook_token`),
  KEY `ix_iwh_ctaid` (`iwh_ctaid`),
  CONSTRAINT `fk_iwh_cta` FOREIGN KEY (`iwh_ctaid`) REFERENCES `conta`(`cta_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lead` (
  `led_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `led_ctaid` bigint unsigned NOT NULL,
  `led_iwhid` bigint unsigned NULL,
  `led_responsavel_usrid` bigint unsigned NULL,
  `led_nome` varchar(255) NOT NULL,
  `led_telefone` varchar(255) NULL,
  `led_email` varchar(255) NULL,
  `led_status` varchar(255) NOT NULL DEFAULT 'novo',
  `led_status_conf` decimal(5,2) NOT NULL DEFAULT 0.00,
  `led_etapa` varchar(255) NOT NULL DEFAULT 'novo',
  `led_valor_total` decimal(12,2) NULL,
  `led_origem` varchar(255) NULL,
  `led_observacoes` text NULL,
  `led_ultima_atualizacao_ia` timestamp NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`led_id`),
  KEY `ix_led_ctaid` (`led_ctaid`),
  KEY `ix_led_status` (`led_status`),
  CONSTRAINT `fk_led_cta` FOREIGN KEY (`led_ctaid`) REFERENCES `conta`(`cta_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_led_iwh` FOREIGN KEY (`led_iwhid`) REFERENCES `instancia_whatsapp`(`iwh_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_led_usr` FOREIGN KEY (`led_responsavel_usrid`) REFERENCES `usuario`(`usr_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mensagem` (
  `msg_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `msg_ledid` bigint unsigned NOT NULL,
  `msg_iwhid` bigint unsigned NOT NULL,
  `msg_direcao` varchar(255) NOT NULL,
  `msg_conteudo` text NOT NULL,
  `msg_msgid` varchar(255) NOT NULL,
  `msg_recebido_em` timestamp NOT NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`msg_id`),
  UNIQUE KEY `uq_msg_msgid` (`msg_msgid`),
  KEY `ix_msg_ledid_msg_recebido_em` (`msg_ledid`,`msg_recebido_em`),
  CONSTRAINT `fk_msg_led` FOREIGN KEY (`msg_ledid`) REFERENCES `lead`(`led_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_iwh` FOREIGN KEY (`msg_iwhid`) REFERENCES `instancia_whatsapp`(`iwh_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `objecao` (
  `obj_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `obj_ctaid` bigint unsigned NULL,
  `obj_nome` varchar(255) NOT NULL,
  `obj_tipo` enum('base','custom') NOT NULL DEFAULT 'base',
  `obj_ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`obj_id`),
  UNIQUE KEY `uq_obj_ctaid_nome` (`obj_ctaid`,`obj_nome`),
  CONSTRAINT `fk_obj_cta` FOREIGN KEY (`obj_ctaid`) REFERENCES `conta`(`cta_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `log_status_lead` (
  `lsl_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lsl_ledid` bigint unsigned NOT NULL,
  `lsl_status_anterior` varchar(255) NOT NULL,
  `lsl_status_novo` varchar(255) NOT NULL,
  `lsl_origem` varchar(255) NOT NULL,
  `lsl_motivo` text NULL,
  `lsl_usrid` bigint unsigned NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`lsl_id`),
  KEY `ix_lsl_ledid` (`lsl_ledid`),
  CONSTRAINT `fk_lsl_led` FOREIGN KEY (`lsl_ledid`) REFERENCES `lead`(`led_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lsl_usr` FOREIGN KEY (`lsl_usrid`) REFERENCES `usuario`(`usr_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auditoria_ia` (
  `aia_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `aia_ledid` bigint unsigned NOT NULL,
  `aia_payload` json NOT NULL,
  `aia_resposta` json NOT NULL,
  `aia_provider` varchar(255) NOT NULL,
  `aia_status` varchar(255) NOT NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`aia_id`),
  KEY `ix_aia_ledid` (`aia_ledid`),
  CONSTRAINT `fk_aia_led` FOREIGN KEY (`aia_ledid`) REFERENCES `lead`(`led_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `fila_job` (
  `fjb_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fjb_tipo` varchar(255) NOT NULL,
  `fjb_status` varchar(255) NOT NULL DEFAULT 'pendente',
  `fjb_tentativas` int unsigned NOT NULL DEFAULT 0,
  `fjb_payload` json NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`fjb_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text NULL,
  `last_used_at` timestamp NULL,
  `expires_at` timestamp NULL,
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
