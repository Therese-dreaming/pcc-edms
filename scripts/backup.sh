#!/bin/bash
# PCC-EDMS Database Backup Script
# Creates daily backups with retention policy

BACKUP_DIR="/var/backups/pcc-edms"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Database backup
DB_DUMP="$BACKUP_DIR/db_backup_$DATE.sql.gz"
php artisan dump:database 2>/dev/null || pg_dump "$DB_DATABASE" | gzip > "$DB_DUMP"

# Compress with timestamp
if [ -f "$DB_DUMP" ]; then
    echo "Database backup created: $DB_DUMP"
else
    echo "Database backup failed"
    exit 1
fi

# File backup (documents)
if [ -d "storage/app/documents" ]; then
    FILE_DUMP="$BACKUP_DIR/file_backup_$DATE.tar.gz"
    tar -czf "$FILE_DUMP" -C storage/app documents
    echo "File backup created: $FILE_DUMP"
fi

# Remove old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup complete. Retention: $RETENTION_DAYS days"