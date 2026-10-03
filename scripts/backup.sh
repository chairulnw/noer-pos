#!/usr/bin/env bash
# Backup harian: dump PostgreSQL + lampiran (volume app di produksi, UPLOAD_DIR di dev), retensi 14 hari.
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_USER="${DB_USER:-pos}"
DB_NAME="${DB_NAME:-pos}"

stamp="$(date +%Y%m%d-%H%M%S)"
tmp="$BACKUP_DIR/.tmp-$stamp"
mkdir -p "$tmp"
trap 'rm -rf "$tmp"' ERR

docker compose exec -T db pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$tmp/db.dump"
docker compose exec -T db pg_restore -l < "$tmp/db.dump" > /dev/null

if docker compose ps --services --status running | grep -qx app; then
  docker compose exec -T app tar -czf - -C /data/uploads . > "$tmp/uploads.tar.gz"
else
  mkdir -p "$UPLOAD_DIR"
  tar -czf "$tmp/uploads.tar.gz" -C "$UPLOAD_DIR" .
fi
tar -tzf "$tmp/uploads.tar.gz" > /dev/null

mv "$tmp" "$BACKUP_DIR/$stamp"
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime +"$RETENTION_DAYS" -exec rm -rf {} +
echo "Backup selesai: $BACKUP_DIR/$stamp"
