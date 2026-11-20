#!/usr/bin/env bash
# Backend dos testes E2E: base de dados DESCARTÁVEL recriada a cada arranque, com os dados de
# demonstração e uma senha só de teste. Porta 8081, para não colidir com o backend de
# desenvolvimento (8080) nem tocar na sua base.
#
# Precisa do backend/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, JWT_SECRET).
set -Eeuo pipefail
umask 077

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
backend="$(cd "$here/../../backend" && pwd)"
E2E_DB_NAME="${E2E_DB_NAME:-ngolahealth_e2e}"

# Só bases de teste: nunca apagar outra coisa por engano.
[[ "$E2E_DB_NAME" =~ ^[a-z0-9_]+_e2e$ ]] || {
  echo "E2E_DB_NAME tem de terminar em _e2e (recebido: $E2E_DB_NAME)" >&2
  exit 1
}

if [[ -f "$backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "$backend/.env"
  set +a
fi
: "${DB_USER:?DB_USER em falta (backend/.env)}"
: "${DB_PASSWORD:?DB_PASSWORD em falta (backend/.env)}"

mysql_bin="$(command -v mysql || true)"
if [[ -z "$mysql_bin" ]]; then
  for candidate in /usr/local/mysql/bin/mysql /usr/local/mysql-*/bin/mysql; do
    [[ -x "$candidate" ]] && mysql_bin="$candidate" && break
  done
fi
[[ -n "$mysql_bin" ]] || { echo "Cliente mysql não encontrado." >&2; exit 1; }

opts="$(mktemp)"
trap 'rm -f "$opts"' EXIT
escaped="${DB_PASSWORD//\\/\\\\}"
escaped="${escaped//\"/\\\"}"
printf '[client]\nhost=%s\nport=%s\nuser=%s\npassword="%s"\n' \
  "${DB_HOST:-127.0.0.1}" "${DB_PORT:-3306}" "$DB_USER" "$escaped" >"$opts"
"$mysql_bin" --defaults-extra-file="$opts" -e \
  "DROP DATABASE IF EXISTS \`$E2E_DB_NAME\`; CREATE DATABASE \`$E2E_DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
rm -f "$opts"
echo "Base $E2E_DB_NAME recriada."

cd "$backend"
export DB_NAME="$E2E_DB_NAME"
export SERVER_PORT="${E2E_BACKEND_PORT:-8081}"
export APP_BASE_URL="http://localhost:${E2E_FRONTEND_PORT:-4300}"
export DEMO_DATA=true
export DEV_ADMIN_PASSWORD="${E2E_PASSWORD:-E2e-Senha-Teste-2026}"
export SPRING_PROFILES_ACTIVE=dev
# Logs de pedidos HTTP desligados: o output do Playwright fica legível.
export LOGGING_LEVEL_NGOLAHEALTH_HTTP=WARN
exec ./mvnw -q spring-boot:run
