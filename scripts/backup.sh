#!/bin/bash
# PCC-EDMS Database + Documents Backup Script
# Creates daily backups with a 30-day retention policy.
# FIXED 2026-08-31: the original called a non-existent `php artisan dump:database` and fell
# back to pg_dump — this system runs MySQL 8.0+ (ADR-003), so it now uses mysqldump with the
# credentials from .env.

set -o pipefail

BACKUP_DIR="/var/backups/pcc-edms"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

cd "$(dirname "$0")/.." || exit 1

mkdir -p "$BACKUP_DIR"

# Read DB credentials from the app's .env (single source of truth).
DB_DATABASE=$(grep '^DB_DATABASE=' .env | cut -d '=' -f2-)
DB_USERNAME=$(grep '^DB_USERNAME=' .env | cut -d '=' -f2-)
DB_PASSWORD=$(grep '^DB_PASSWORD=' .env | cut -d '=' -f2-)
DB_HOST=$(grep '^DB_HOST=' .env | cut -d '=' -f2-)
DB_PORT=$(grep '^DB_PORT=' .env | cut -d '=' -f2-)

DB_DUMP="$BACKUP_DIR/db_backup_$DATE.sql.gz"
if mysqldump --host="${DB_HOST:-127.0.0.1}" --port="${DB_PORT:-3306}" \
    --user="${DB_USERNAME}" --password="${DB_PASSWORD}" \
    --single-transaction --routines --triggers "$DB_DATABASE" | gzip > "$DB_DUMP"; then
    echo "Database backup created: $DB_DUMP"
else
    echo "Database backup failed"
    rm -f "$DB_DUMP"
    exit 1
fi

# File backup (uploaded + generated documents on the local documents disk).
if [ -d "storage/app/documents" ]; then
    FILE_DUMP="$BACKUP_DIR/file_backup_$DATE.tar.gz"
    tar -czf "$FILE_DUMP" -C storage/app documents
    echo "File backup created: $FILE_DUMP"
fi

# Remove old backups.
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup complete. Retention: $RETENTION_DAYS days"
