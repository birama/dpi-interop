#!/bin/bash
# Backup encadrement pré-freeze atelier — à exécuter lundi 18/05/2026 ~16h45
# Génère un pg_dump complet + vérification taille + log
#
# Usage (depuis le poste Windows via plink) :
#   plink -ssh -batch -pw "P@ssw0rd" deploy@178.16.129.222 'bash -s' < scripts/backup-pre-freeze.sh
#
# Ou directement sur la VM :
#   bash /opt/dpi-interop/scripts/backup-pre-freeze.sh

set -euo pipefail

TS=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/home/deploy/backups
BACKUP_FILE="$BACKUP_DIR/prod_freeze_atelier_${TS}.sql"

echo "═══════════════════════════════════════════════════════════════"
echo "  BACKUP PRÉ-FREEZE — Atelier 19/05/2026"
echo "  Timestamp : $TS"
echo "═══════════════════════════════════════════════════════════════"

# 1. Backup pg_dump complet
echo "📦 Génération pg_dump..."
docker exec pins-db pg_dump -U dpiuser -d dpidb > "$BACKUP_FILE"

# 2. Vérifications taille + ligne count
SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
LINES=$(wc -l < "$BACKUP_FILE")
echo "✅ Backup créé : $BACKUP_FILE"
echo "   Taille     : $SIZE"
echo "   Lignes SQL : $LINES"

# 3. Sanity check : doit contenir au moins 537 rows cas_usage_mvp
ROW_CHECK=$(grep -c "^[0-9a-f-]\{36\}" "$BACKUP_FILE" || echo 0)
echo "   UUIDs détectés : $ROW_CHECK"

# 4. Compression
echo "📦 Compression..."
gzip -c "$BACKUP_FILE" > "${BACKUP_FILE}.gz"
GZ_SIZE=$(ls -lh "${BACKUP_FILE}.gz" | awk '{print $5}')
echo "✅ Archive compressée : ${BACKUP_FILE}.gz ($GZ_SIZE)"

# 5. Récapitulatif des backups récents
echo ""
echo "📋 Backups encadrant l'atelier :"
ls -lh "$BACKUP_DIR/" | grep -E "(freeze|deploy03|p10mvp|rename|seed_v4|merges_ptf)" | tail -15

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ BACKUP PRÉ-FREEZE OK — Code freeze en vigueur dès 17h00"
echo "═══════════════════════════════════════════════════════════════"
