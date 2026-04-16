#!/usr/bin/env bash
# FunMarket SQLite Backup Script
# Usage: ./scripts/backup-db.sh
# Set BACKUP_DIR to customize the backup location (default: ./backups)

set -euo pipefail

DB_PATH="${DATABASE_URL:-file:./funmarket.db}"
# Strip the "file:" prefix if present
DB_FILE="${DB_PATH#file:}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/funmarket_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file not found at $DB_FILE"
  exit 1
fi

# SQLite online backup via cp (safe for WAL mode with checkpoint)
sqlite3 "$DB_FILE" ".backup '${BACKUP_FILE}'" 2>/dev/null || cp "$DB_FILE" "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

echo "Backup created: ${BACKUP_FILE}.gz"

# Keep only the last 30 backups
ls -t "${BACKUP_DIR}"/funmarket_*.db.gz 2>/dev/null | tail -n +31 | xargs -r rm --

echo "Done. Current backups:"
ls -lh "${BACKUP_DIR}"/funmarket_*.db.gz 2>/dev/null | wc -l | xargs echo "  Count:"
