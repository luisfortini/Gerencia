#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

cd "$ROOT_DIR/backend"
if command -v composer >/dev/null 2>&1; then
  composer install
else
  echo "[warn] Composer não foi encontrado no PATH." >&2
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

if command -v php >/dev/null 2>&1; then
  php artisan key:generate --ansi
  php artisan migrate --seed
else
  echo "[warn] PHP não foi encontrado no PATH." >&2
fi

cd "$ROOT_DIR/frontend"
if command -v npm >/dev/null 2>&1; then
  npm install
else
  echo "[warn] npm não foi encontrado no PATH." >&2
fi

cd "$ROOT_DIR/landing"
if command -v npm >/dev/null 2>&1; then
  npm install
else
  echo "[warn] npm não foi encontrado no PATH." >&2
fi

echo "✅ Setup concluído. Execute 'php artisan serve' (backend), 'npm run dev' (frontend) e 'npm run dev' (landing) conforme necessário."
