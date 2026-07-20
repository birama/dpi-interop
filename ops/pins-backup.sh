#!/bin/bash
# PINS — Backup quotidien PostgreSQL
# Rotation : 7 jours de rétention

set -e

BACKUP_DIR=/opt/dpi-interop/backups
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M)
BACKUP_FILE="$BACKUP_DIR/pins-db-$TIMESTAMP.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

log() { echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1" >> "$LOG_FILE"; }

log "START backup → $BACKUP_FILE"

if docker exec pins-db pg_dump -U pins -d questionnaire_interop --no-owner --no-acl > "$BACKUP_FILE" 2>/tmp/backup-err.log; then
  gzip "$BACKUP_FILE"
  SIZE=$(stat -c%s "$BACKUP_FILE.gz" 2>/dev/null || echo 0)
  log "OK $(basename "$BACKUP_FILE").gz ($SIZE bytes)"
else
  log "FAIL $(cat /tmp/backup-err.log)"
  exit 1
fi

# Rotation : supprimer les backups de plus de 7 jours
DELETED=$(find "$BACKUP_DIR" -name "pins-db-*.sql.gz" -mtime +$RETENTION_DAYS -delete -print 2>/dev/null | wc -l)
[ "$DELETED" -gt 0 ] && log "ROTATION deleted=$DELETED old backups"
[ -f /tmp/backup-err.log ] && rm /tmp/backup-err.log

log "END"
