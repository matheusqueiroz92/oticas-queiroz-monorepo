#!/usr/bin/env bash
# Backup do MongoDB de produção (oticas-queiroz-db).
# Uso manual: sudo bash scripts/ops/mongo-backup.sh
# Cron: ver scripts/ops/README.md
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/apps/oticas-queiroz/.env}"
CONTAINER="${MONGO_CONTAINER:-oticas-queiroz-db}"
DB_NAME="${MONGO_DB_NAME:-oticas_queiroz_db}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/backups/oticas-queiroz}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_FILE="${LOG_FILE:-/var/log/oticas-queiroz-mongo-backup.log}"
MIN_BYTES="${MIN_BYTES:-102400}" # 100 KiB — falha se dump menor (banco vazio/corrompido)

TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
ARCHIVE_NAME="oticas_queiroz_db-${TIMESTAMP}.archive.gz"
ARCHIVE_PATH="${BACKUP_ROOT}/${ARCHIVE_NAME}"
TMP_ARCHIVE="/tmp/${ARCHIVE_NAME}"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

die() {
  log "ERRO: $*"
  exit 1
}

[[ -f "$ENV_FILE" ]] || die "Arquivo .env não encontrado: $ENV_FILE"
docker ps --format '{{.Names}}' | grep -qx "$CONTAINER" || die "Container $CONTAINER não está rodando"

mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT" 2>/dev/null || true

# Lê MONGODB_URI sem interpretar $ (evita quebra com senhas especiais no shell)
MONGODB_URI="$(grep -E '^MONGODB_URI=' "$ENV_FILE" | sed 's/^MONGODB_URI=//' | tr -d '\r' | head -n1)"
[[ -n "$MONGODB_URI" ]] || die "MONGODB_URI não definida em $ENV_FILE"

log "Iniciando backup → $ARCHIVE_PATH"

# Dump dentro do container (mongodump já vem na imagem mongo:7)
if ! docker exec "$CONTAINER" mongodump \
  --uri="$MONGODB_URI" \
  --db="$DB_NAME" \
  --archive="$TMP_ARCHIVE" \
  --gzip; then
  die "mongodump falhou"
fi

docker cp "${CONTAINER}:${TMP_ARCHIVE}" "$ARCHIVE_PATH"
docker exec "$CONTAINER" rm -f "$TMP_ARCHIVE" 2>/dev/null || true

# --- Validação ---
[[ -f "$ARCHIVE_PATH" ]] || die "Arquivo de backup não foi criado"

SIZE="$(stat -c%s "$ARCHIVE_PATH" 2>/dev/null || stat -f%z "$ARCHIVE_PATH")"
if [[ "$SIZE" -lt "$MIN_BYTES" ]]; then
  rm -f "$ARCHIVE_PATH"
  die "Backup suspeito (tamanho ${SIZE} bytes < ${MIN_BYTES})"
fi

if ! gzip -t "$ARCHIVE_PATH" 2>/dev/null; then
  rm -f "$ARCHIVE_PATH"
  die "Arquivo gzip inválido (integridade)"
fi

# Valida estrutura do archive com mongorestore --dryRun (MongoDB 7+)
docker cp "$ARCHIVE_PATH" "${CONTAINER}:${TMP_ARCHIVE}"
if ! docker exec "$CONTAINER" mongorestore \
  --gzip \
  --archive="$TMP_ARCHIVE" \
  --dryRun \
  --nsInclude="${DB_NAME}.*"; then
  docker exec "$CONTAINER" rm -f "$TMP_ARCHIVE" 2>/dev/null || true
  rm -f "$ARCHIVE_PATH"
  die "mongorestore --dryRun falhou (archive corrompido ou ilegível)"
fi
docker exec "$CONTAINER" rm -f "$TMP_ARCHIVE" 2>/dev/null || true

chmod 600 "$ARCHIVE_PATH" 2>/dev/null || true

# Retenção: remove backups .archive.gz mais antigos que RETENTION_DAYS
DELETED="$(find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'oticas_queiroz_db-*.archive.gz' -mtime +"$RETENTION_DAYS" -print -delete | wc -l)"
log "Backup OK: $ARCHIVE_PATH (${SIZE} bytes). Removidos antigos: ${DELETED}"

exit 0
