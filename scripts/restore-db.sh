#!/usr/bin/env bash
# =============================================================================
#  Guest House Manager — Database Restore Script
#  Restores a .sql.gz dump into the PostgreSQL Docker container
# =============================================================================

set -e

CONTAINER_NAME="${DB_CONTAINER_NAME:-guesthouse-db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-guesthouse_db}"

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <path-to-backup-file.sql.gz>"
    echo "Example: $0 database/backups/backup_guesthouse_db_20260728_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found at '$BACKUP_FILE'"
    exit 1
fi

echo "============================================================"
echo "⚠️  DATABASE RESTORE WARNING"
echo "============================================================"
echo "This operation will OVERWRITE current data in database '${DB_NAME}'."
echo "Target Container: ${CONTAINER_NAME}"
echo "Backup File:      ${BACKUP_FILE}"
echo "============================================================"

# Confirmation prompt unless -y / FORCE_RESTORE=true is set
if [ "$2" != "-y" ] && [ "$FORCE_RESTORE" != "true" ]; then
    read -p "Are you sure you want to proceed? (type 'yes' to confirm): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Operation cancelled."
        exit 0
    fi
fi

echo "📦 Restoring database..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"

echo "============================================================"
echo "✅ Database restore completed successfully!"
echo "============================================================"
