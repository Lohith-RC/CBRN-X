#!/bin/bash
# CBRS-X Automated PostgreSQL Backup Script
# Usage: ./backup.sh [backup_dir] [retention_days]
#
# This script creates compressed PostgreSQL backups and manages retention.
# Run via cron: 0 2 * * * /path/to/backup.sh /backups/cbrsx 7

set -euo pipefail

BACKUP_DIR="${1:-/backups/cbrsx}"
RETENTION_DAYS="${2:-7}"
CONTAINER_NAME="cbrsx-db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/cbrsx_${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Check if Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    error "Container '${CONTAINER_NAME}' is not running."
fi

log "Starting CBRS-X PostgreSQL backup..."

# Create backup using pg_dump
if docker exec "${CONTAINER_NAME}" pg_dump \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-cbrsx_db}" \
    --format=custom \
    --compress=9 \
    --verbose \
    2>/dev/null | gzip > "${BACKUP_FILE}"; then
    
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "Backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    error "Backup failed. Check container logs."
fi

# Verify backup integrity
if gzip -t "${BACKUP_FILE}" 2>/dev/null; then
    log "Backup integrity verified."
else
    error "Backup file is corrupted!"
fi

# Manage retention - delete backups older than RETENTION_DAYS
DELETED_COUNT=0
while IFS= read -r -d '' old_backup; do
    rm -f "${old_backup}"
    DELETED_COUNT=$((DELETED_COUNT + 1))
done < <(find "${BACKUP_DIR}" -name "cbrsx_*.sql.gz" -mtime +${RETENTION_DAYS} -print0 2>/dev/null)

if [ "${DELETED_COUNT}" -gt 0 ]; then
    log "Cleaned up ${DELETED_COUNT} backup(s) older than ${RETENTION_DAYS} days."
fi

# List current backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "cbrsx_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
log "Current backup inventory: ${BACKUP_COUNT} backup(s), total size: ${TOTAL_SIZE}"

log "Backup process completed."
