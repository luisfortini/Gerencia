# GerencIA — Guia Rápido de Deploy e Atualização (HostGator cPanel)

> **Objetivo:** checklist prático para colocar no ar e atualizar **frontend (Vite)** e **backend (Laravel)** na HostGator **sem SSH**.  
> **Domínios de referência:**  
> - **Frontend:** `https://crmgerencia.com.br` ou `https://app.crmgerencia.com.br`  
> - **Backend/API:** `https://api.crmgerencia.com.br` (document root em `/public`)

---

## 0) Pré-requisitos e padrões de pasta
- **cPanel** acessível.
- Subdomínio **api.crmgerencia.com.br** apontando para:  
  `…/api.crmgerencia.com.br/public` (Document Root).
- PHP compatível com seu Laravel (ex.: 8.2+).
- **Nunca** exponha o backend fora de `/public`.

---

## 1) Frontend (Vite + TS + Tailwind)

### Build de produção (local)
1. Na raiz do **frontend** crie/edite `.env.production`:
   ```env
   VITE_API_URL=https://api.crmgerencia.com.br
   ```
2. Rode:
   ```bash
   npm run build
   ```
3. Isso gera a pasta `dist/`.

### Upload no cPanel
1. Compacte **o conteúdo** de `dist/` (não a pasta em si) em `dist.zip`.
2. Envie para o diretório do domínio do frontend (ex.: `crmgerencia.com.br/`).
3. **Extraia** e substitua os arquivos antigos.

### Testes
- Acesse o site e verifique o console de rede (DevTools).
- Chame `https://api.crmgerencia.com.br/api/ping` a partir do frontend.

> **Atualizar:** repetir o processo. Versões antigas: mantenha `dist_backup_YYYY-MM-DD.zip` local.

---

## 2) Backend (Laravel)

### Estrutura no servidor
```
/home/SEU_USUARIO/
 └── api.crmgerencia.com.br/
      ├── app/
      ├── bootstrap/
      ├── config/
      ├── database/
      ├── public/         ← Document Root do subdomínio
      ├── resources/
      ├── routes/
      ├── storage/
      ├── vendor/
      ├── .env
      ├── artisan
      └── composer.json
```

### .env de produção (modelo)
```env
APP_NAME=GerencIA
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.crmgerencia.com.br
APP_KEY=                 # deixe vazio para gerar no servidor

DB_CONNECTION=mysql
DB_HOST=SEU_HOST
DB_PORT=3306
DB_DATABASE=SEU_BANCO
DB_USERNAME=SEU_USUARIO
DB_PASSWORD=SUA_SENHA

# CORS / Front
CORS_ALLOWED_ORIGINS=https://app.crmgerencia.com.br,https://crmgerencia.com.br,https://www.crmgerencia.com.br
SESSION_DOMAIN=.crmgerencia.com.br
SANCTUM_STATEFUL_DOMAINS=crmgerencia.com.br,www.crmgerencia.com.br,app.crmgerencia.com.br

# E-mail (ex.: Titan)
MAIL_MAILER=smtp
MAIL_HOST=smtp.titan.email
MAIL_PORT=587
MAIL_USERNAME=SEU_EMAIL@SEUDOMINIO.com.br
MAIL_PASSWORD=SUA_SENHA
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=SEU_EMAIL@SEUDOMINIO.com.br
MAIL_FROM_NAME="${APP_NAME}"

# Serviços
EVOLUTION_BASE_URL=https://evolutionapi.efortini.com.br
EVOLUTION_API_KEY=
EVOLUTION_VERIFY_SSL=false
OPENAI_VERIFY_SSL=false

FILESYSTEM_DISK=public
```

### Upload no cPanel (sem SSH)
1. **Localmente**, instale dependências de produção:
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
2. Compacte tudo (exceto `node_modules`, `.git`, `tests`) em `api.zip`.
3. Envie para `api.crmgerencia.com.br/` e **extraia**.
4. Confirme que o subdomínio aponta para `…/api.crmgerencia.com.br/public`.

### .htaccess (obrigatório) — `public/.htaccess`
Inclui **CORS** + **rewrite Laravel** + **preflight OPTIONS**:
```apache
# --- CORS para preflight na hospedagem (HostGator/Apache) ---
<IfModule mod_headers.c>
    SetEnvIf Origin "https://app\.crmgerencia\.com\.br$" ACAO=$0
    SetEnvIf Origin "https://crmgerencia\.com\.br$" ACAO=$0
    SetEnvIf Origin "https://www\.crmgerencia\.com\.br$" ACAO=$0

    Header always set Access-Control-Allow-Origin %{ACAO}e env=ACAO
    Header always set Access-Control-Allow-Credentials "true"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With, Accept, Origin, X-Conta-Id"

    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} =OPTIONS
    RewriteRule ^ - [R=204,L]
</IfModule>
# --- fim do bloco CORS ---

<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>

<IfModule mod_headers.c>
    Header unset X-Powered-By
</IfModule>
FileETag None
```

### CORS no Laravel — `config/cors.php` (exemplo)
```php
<?php
$localOrigins = [
    'http://localhost:5173','http://localhost:5174','http://localhost:5175',
    'http://127.0.0.1:5173','http://127.0.0.1:5174','http://127.0.0.1:5175',
];
$allowedOrigins = array_values(array_filter(array_map('trim',
    explode(',', env('CORS_ALLOWED_ORIGINS', implode(',', $localOrigins)))
)));

return [
    'paths' => ['api/*','auth/*','webhook/*','sanctum/csrf-cookie'],
    'allowed_methods' => ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    'allowed_origins' => $allowedOrigins ?: $localOrigins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Authorization','Content-Type','X-Requested-With','Accept','Origin','X-Conta-Id'],
    'exposed_headers' => ['Authorization'],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### Scripts úteis (sem Terminal) — usar temporariamente em `/public`

#### 2.1) `artisan-run.php` (setup inicial)
```php
<?php
header('Content-Type: text/plain; charset=utf-8');
$secret = 'TROQUE-ESTA-CHAVE'; if (($_GET['key'] ?? '') !== $secret) { http_response_code(403); exit("Forbidden\n"); }
$root = realpath(__DIR__ . '/..'); chdir($root); $php = PHP_BINARY ?: 'php';

@mkdir($root.'/storage/app/public', 0755, true);
$env = file_exists($root.'/.env') ? file_get_contents($root.'/.env') : '';
$needForce = (strpos($env, "APP_KEY=") !== false && preg_match('/^APP_KEY=\s*$/m', $env));

$cmds = [
  $needForce ? "$php artisan key:generate --force" : '',
  "$php artisan config:clear",
  "$php artisan config:cache",
  "$php artisan route:cache",
  "$php artisan optimize",
  "$php artisan storage:link",
  "$php artisan migrate --force",
];
echo "Dir: ".getcwd()."\nPHP: $php\n\n";
foreach ($cmds as $c) { if (!$c) { echo ">> Pulando key:generate (APP_KEY já definido)\n\n"; continue; }
  echo ">> $c\n"; echo shell_exec($c.' 2>&1'); echo "\n-----------------\n"; }
echo "OK. DELETE este arquivo por segurança.\n";
```
**Como usar:** acesse `https://api.crmgerencia.com.br/artisan-run.php?key=SUA_CHAVE` e **delete** o arquivo depois.

#### 2.2) `refresh-config.php` (recarregar cache em atualizações)
```php
<?php
header('Content-Type: text/plain; charset=utf-8');
$secret = 'TROQUE-ESTA-CHAVE'; if (($_GET['key'] ?? '') !== $secret) { http_response_code(403); exit("Forbidden\n"); }
$root = realpath(__DIR__ . '/..'); chdir($root); $php = PHP_BINARY ?: 'php';
$cmds = ["$php artisan config:clear","$php artisan config:cache","$php artisan route:cache","$php artisan optimize"];
foreach ($cmds as $c) { echo ">> $c\n"; echo shell_exec($c.' 2>&1'), "\n-----------------\n"; }
echo "OK. DELETE este arquivo por segurança.\n";
```

> **Segurança:** defina uma chave forte, execute e **apague** os scripts. Não deixe esses arquivos publicados.

### Rotas de teste
- **Ping:** `routes/api.php`
  ```php
  Route::get('/ping', fn() => response()->json(['status'=>'ok','message'=>'API GerencIA online 🚀']));
  ```
- Teste no navegador: `https://api.crmgerencia.com.br/api/ping`

> **Atenção:** rotas em `routes/api.php` têm prefixo `/api` automaticamente. Ex.: `POST /api/auth/login`.

---

## 3) Atualização (resumo)
**Frontend**
1. Ajuste código/variáveis → `npm run build` local.
2. Envie `dist.zip` → extraia no domínio → teste.

**Backend**
1. Local: `composer install --no-dev --optimize-autoloader`.
2. Zip do projeto (com `vendor/`) → enviar e extrair.
3. Atualize `.env` se necessário.
4. Rode `refresh-config.php` (ou `artisan-run.php` se houver migrations).  
5. Apague os scripts temporários.

**Rollback rápido**
- Mantenha zips versionados localmente: `dist_YYYY-MM-DD.zip`, `api_YYYY-MM-DD.zip`.
- Para voltar, reenvie o zip anterior e extraia.

---

## 4) Troubleshooting
- **404 no `/auth/login`** → Está em `routes/api.php`? Use `/api/auth/login`.
- **CORS bloqueado** → Verifique `public/.htaccess` (bloco CORS) e `config/cors.php` + `.env` (origens sem `/` no final).  
- **`Could not open input file: artisan`** → script estava em `/public`; use `chdir('..')` antes, ou use os scripts deste guia.
- **`storage:link` falha** → crie `storage/app/public` e rode novamente; em último caso, crie `public/storage` como fallback.
- **Erro 500** → Veja `storage/logs/laravel.log` (use Gerenciador de Arquivos para abrir).
- **Página em branco no subdomínio** → Document Root deve ser `…/api.crmgerencia.com.br/public`.
- **PHP errado** → Versão de PHP no cPanel (Selecionar Versão do PHP) compatível com seu Laravel.

---

## 5) Segurança
- **Excluir** `artisan-run.php` e `refresh-config.php` após uso.
- `.env` nunca no repositório público.
- Manter backups locais versionados.
- Headers no `.htaccess` já removem `X-Powered-By`.

---

## 6) Checagens finais
- ✅ `https://api.crmgerencia.com.br/api/ping` responde `ok`.
- ✅ Front chama `VITE_API_URL=https://api.crmgerencia.com.br`.
- ✅ CORS ok do domínio do front.
- ✅ Rotas com prefixo `/api` funcionando.
- ✅ Scripts temporários apagados.

---

**Pronto.** Este guia resume todo o fluxo **deploy → teste → update → rollback** na HostGator, sem SSH.
