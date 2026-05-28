# Scripts de operação (VPS)

## Backup MongoDB (`mongo-backup.sh`)

Backup do banco real `oticas_queiroz_db` no container `oticas-queiroz-db`.

| Item | Valor padrão |
|------|----------------|
| Destino | `/opt/backups/oticas-queiroz/` |
| Nome do arquivo | `oticas_queiroz_db-YYYYMMDD-HHMMSS.archive.gz` |
| Retenção | 30 dias |
| Log | `/var/log/oticas-queiroz-mongo-backup.log` |

### 1. Instalar na VPS (uma vez)

```bash
mkdir -p /opt/backups/oticas-queiroz
chmod 700 /opt/backups/oticas-queiroz

# Copiar script do repositório
cp /var/www/oticas-queiroz/scripts/ops/mongo-backup.sh /opt/apps/oticas-queiroz/mongo-backup.sh
chmod 700 /opt/apps/oticas-queiroz/mongo-backup.sh
```

### 2. Teste manual

```bash
sudo bash /opt/apps/oticas-queiroz/mongo-backup.sh
ls -lh /opt/backups/oticas-queiroz/
tail -20 /var/log/oticas-queiroz-mongo-backup.log
```

### 3. Cron diário (03:15 UTC)

```bash
sudo crontab -e
```

Adicione:

```cron
15 3 * * * /opt/apps/oticas-queiroz/mongo-backup.sh >> /var/log/oticas-queiroz-mongo-backup.log 2>&1
```

### 4. Restaurar (emergência)

**Cuidado:** restaurar sobrescreve dados do banco alvo. Faça só em ambiente de teste ou com parada da aplicação.

```bash
ARCHIVE=/opt/backups/oticas-queiroz/oticas_queiroz_db-YYYYMMDD-HHMMSS.archive.gz
ENV_FILE=/opt/apps/oticas-queiroz/.env
CONTAINER=oticas-queiroz-db
MONGODB_URI="$(grep -E '^MONGODB_URI=' "$ENV_FILE" | sed 's/^MONGODB_URI=//' | tr -d '\r')"

docker cp "$ARCHIVE" "${CONTAINER}:/tmp/restore.archive.gz"
docker exec "$CONTAINER" mongorestore \
  --uri="$MONGODB_URI" \
  --gzip \
  --archive=/tmp/restore.archive.gz \
  --drop \
  --nsInclude='oticas_queiroz_db.*'
```

### Variáveis opcionais

```bash
export ENV_FILE=/opt/apps/oticas-queiroz/.env
export MONGO_CONTAINER=oticas-queiroz-db
export BACKUP_ROOT=/opt/backups/oticas-queiroz
export RETENTION_DAYS=30
```

### O que o script valida

1. Container Mongo rodando  
2. `mongodump` com exit 0  
3. Arquivo existe e tamanho mínimo (100 KiB)  
4. `gzip -t` (integridade do gzip)  
5. `mongorestore --dryRun` (estrutura legível do archive)

### Backup off-site (recomendado)

Copie periodicamente para outro servidor ou storage:

```bash
# Exemplo com rsync para outro host
rsync -avz /opt/backups/oticas-queiroz/ user@backup-server:/backups/oticas-queiroz/
```
