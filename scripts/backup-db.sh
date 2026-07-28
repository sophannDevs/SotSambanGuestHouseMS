#!/usr/bin/env bash
# =============================================================================
#  Guest House Manager — Database Backup Script
#  Performs pg_dump from PostgreSQL Docker container, compresses, & manages retention
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${ROOT_DIR}/database/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="${DB_CONTAINER_NAME:-guesthouse-db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-guesthouse_db}"
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "============================================================"
echo "💾 Starting Database Backup..."
echo "============================================================"
echo "Timestamp:      ${TIMESTAMP}"
echo "Container:      ${CONTAINER_NAME}"
echo "Database:       ${DB_NAME}"
echo "Target File:    ${BACKUP_FILE}"
echo "============================================================"

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Docker container '${CONTAINER_NAME}' is not running."
    exit 1
fi

# Execute pg_dump and compress on the fly
echo "📦 Dumping database..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"

# Verify backup file size
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup completed successfully! (Size: ${FILE_SIZE})"

# Upload to AWS S3 if bucket is specified in environment
if [ -n "$S3_BUCKET_NAME" ]; then
    echo "☁️  Uploading backup to AWS S3 bucket: ${S3_BUCKET_NAME}..."
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET_NAME}/database-backups/$(basename "$BACKUP_FILE")"
        echo "✅ S3 Upload completed."
    else
        echo "⚠️  AWS CLI is not installed on this system. Skipping S3 upload."
    fi
fi

# Retention pruning: remove local backups older than RETENTION_DAYS
echo "🧹 Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete || true

echo "============================================================"
echo "🎉 Backup Process Complete!"
echo "============================================================"
