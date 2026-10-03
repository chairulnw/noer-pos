#!/usr/bin/env bash
# Pakai: scripts/restore.sh <folder-backup> <nama-db-baru> [folder-uploads-tujuan]
# DB tujuan harus belum ada (tidak menimpa data yang berjalan).
set -euo pipefail
cd "$(dirname "$0")/.."

src="${1:?folder backup wajib, mis. backups/20261003-020000}"
target="${2:?nama database tujuan wajib (belum ada)}"
uploads_to="${3:-./uploads-restored}"
DB_USER="${DB_USER:-pos}"

[ -f "$src/db.dump" ] && [ -f "$src/uploads.tar.gz" ] || { echo "Folder backup tidak lengkap: $src" >&2; exit 1; }

docker compose exec -T db createdb -U "$DB_USER" "$target"
docker compose exec -T db pg_restore -U "$DB_USER" --no-owner -d "$target" < "$src/db.dump"

mkdir -p "$uploads_to"
tar -xzf "$src/uploads.tar.gz" -C "$uploads_to"
echo "Restore selesai: database '$target', lampiran di '$uploads_to'"
