#!/bin/bash
# ============================================================================
# PINS — Script de déploiement production
# À exécuter depuis /opt/dpi-interop/questionnaire-interop
# Prérequis : backend/.env existant, pins-db accessible, Docker installé
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M)
BACKUP_DIR="/opt/dpi-interop/backups"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="backend/.env"

log()  { echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $1"; }
fail() { log "FAIL: $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║    PINS — Déploiement production                            ║"
echo "║    $(date)                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# Pré-vérifications
# ============================================================================
[ -f "$ENV_FILE" ] || fail "$ENV_FILE introuvable — créer le avant de déployer"
[ -f "$COMPOSE_FILE" ] || fail "$COMPOSE_FILE introuvable"

# ============================================================================
# Étape 1 — Backup pg_dump AVANT toute modification
# ============================================================================
log "Étape 1/6 — Backup base de données"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/prod_avant_deploy_${TIMESTAMP}.sql"
if docker exec pins-db pg_dump -U pins -d questionnaire_interop --no-owner --no-acl > "$BACKUP_FILE" 2>/dev/null; then
  SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || echo 0)
  if [ "$SIZE" -lt 1000000 ]; then
    rm -f "$BACKUP_FILE"
    fail "Backup trop petit : $SIZE octets (< 1 Mo), dump probablement incomplet"
  fi
  log "Backup OK : $(basename "$BACKUP_FILE") ($(numfmt --to=iec $SIZE 2>/dev/null || echo ${SIZE} bytes))"
else
  fail "pg_dump a échoué — vérifier que pins-db est accessible"
fi

# ============================================================================
# Étape 2 — Git pull
# ============================================================================
log "Étape 2/6 — Mise à jour du code"
COMMIT_BEFORE=$(git log --oneline -1 2>/dev/null || echo "unknown")

git pull origin main || fail "git pull a échoué"

COMMIT_AFTER=$(git log --oneline -1)
log "Avant : $COMMIT_BEFORE"
log "Après : $COMMIT_AFTER"

# ============================================================================
# Étape 3 — Build des images
# ============================================================================
log "Étape 3/6 — Build des images Docker"
docker compose -f "$COMPOSE_FILE" build backend frontend || fail "Build Docker échoué"
log "Build OK"

# ============================================================================
# Étape 4 — Migration (AVANT démarrage du nouveau backend)
# ============================================================================
log "Étape 4/6 — Migration Prisma"
# Arrêter l'ancien backend pour libérer les connexions DB
docker stop pins-api 2>/dev/null || true

# Exécuter la migration via un conteneur temporaire
docker run --rm \
  --network pins-net \
  -v "$(pwd)/backend/prisma:/app/prisma:ro" \
  --env-file "$ENV_FILE" \
  --entrypoint npx \
  questionnaire-interop-backend \
  prisma migrate deploy || fail "Migration Prisma échouée"

log "Migration OK"

# ============================================================================
# Étape 5 — Démarrage des conteneurs
# ============================================================================
log "Étape 5/6 — Démarrage des conteneurs"
docker compose -f "$COMPOSE_FILE" up -d backend frontend || fail "docker compose up échoué"
log "Conteneurs démarrés"

# ============================================================================
# Étape 6 — Health check
# ============================================================================
log "Étape 6/6 — Health check"
for i in $(seq 1 12); do
  if curl -sf http://localhost/health > /dev/null 2>&1; then
    log "Health OK après ${i}0 secondes"
    break
  fi
  if [ $i -eq 12 ]; then
    log "Logs pins-api (30 dernières lignes) :"
    docker logs pins-api --tail 30 2>&1 || true
    fail "Health check timeout (> 120s) — voir logs ci-dessus"
  fi
  sleep 10
done

# ============================================================================
# Récapitulatif
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║    DÉPLOIEMENT RÉUSSI                                       ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║    Backup : $(basename "$BACKUP_FILE")"
echo "║    Commit : $COMMIT_AFTER"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAMES|pins-"
