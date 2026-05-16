#!/usr/bin/env bash
set -euo pipefail

SERVICE_ROOT="/home/err/devel/services/proxx"
PROD_DB_CONTAINER="${PROXX_PROD_DB_CONTAINER:-proxx-local-proxx-local-db-1}"
DEV_DB_CONTAINER="${PROXX_DEV_DB_CONTAINER:-proxx-dev-local-proxx-dev-db-1}"
DB_NAME="${PROXX_DB_NAME:-openai_proxy}"
DB_USER="${PROXX_DB_USER:-openai_proxy}"

TABLES=(
  public.providers
  public.accounts
  public.tenant_provider_policies
  public.account_health
  public.account_cooldown
)
PG_DUMP_TABLE_ARGS=()
for table in "${TABLES[@]}"; do
  PG_DUMP_TABLE_ARGS+=("--table=$table")
done

cd "$SERVICE_ROOT"

docker compose -f docker-compose.dev-db.yml up -d proxx-dev-db >/dev/null

for _ in $(seq 1 60); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$DEV_DB_CONTAINER" 2>/dev/null || true)"
  if [[ "$status" == "healthy" ]]; then
    break
  fi
  sleep 1
done

if [[ "$(docker inspect -f '{{.State.Health.Status}}' "$DEV_DB_CONTAINER" 2>/dev/null || true)" != "healthy" ]]; then
  echo "dev db is not healthy: $DEV_DB_CONTAINER" >&2
  exit 1
fi

if ! docker inspect "$PROD_DB_CONTAINER" >/dev/null 2>&1; then
  echo "prod db container not found: $PROD_DB_CONTAINER" >&2
  exit 1
fi

# Ensure schema exists in the dev database without dumping table data to disk or stdout.
docker exec "$PROD_DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --schema-only \
  "${PG_DUMP_TABLE_ARGS[@]}" \
  | docker exec -i "$DEV_DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" >/dev/null

# Refresh the credential/provider subset. This intentionally avoids request logs,
# sessions, OAuth tokens, and other operational state.
docker exec "$DEV_DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" \
  -c "truncate table account_cooldown, account_health, tenant_provider_policies, accounts, providers cascade;" >/dev/null

docker exec "$PROD_DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --column-inserts \
  "${PG_DUMP_TABLE_ARGS[@]}" \
  | docker exec -i "$DEV_DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" >/dev/null

providers="$(docker exec "$DEV_DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -Atc 'select count(*) from providers')"
accounts="$(docker exec "$DEV_DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -Atc 'select count(*) from accounts')"
health="$(docker exec "$DEV_DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -Atc 'select count(*) from account_health')"
cooldowns="$(docker exec "$DEV_DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -Atc 'select count(*) from account_cooldown')"

echo "seeded dev db from prod: providers=$providers accounts=$accounts account_health=$health account_cooldown=$cooldowns"
