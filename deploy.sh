#!/bin/bash
# ============================================================================
# Script de déploiement — PINS
# Usage: ./deploy.sh [server_ip]
# ============================================================================

set -e

SERVER=${1:-192.168.40.128}
USER=${2:-root}
REMOTE_DIR="/opt/pins"
ENV_FILE=".env.production"

echo "🚀 Déploiement PINS sur $SERVER"
echo "============================================"

# Vérifier que le fichier .env.production existe
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Fichier $ENV_FILE introuvable !"
    echo "   Copiez .env.production.example → .env.production et remplissez les valeurs."
    exit 1
fi

# 1. Créer le répertoire distant
echo "📁 Création du répertoire distant..."
ssh $USER@$SERVER "mkdir -p $REMOTE_DIR"

# 2. Copier les fichiers
echo "📦 Copie des fichiers..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
    --exclude '.env' --exclude '*.output' --exclude 'tmpclaude-*' \
    ./ $USER@$SERVER:$REMOTE_DIR/

# 3. Copier le .env.production comme .env
scp $ENV_FILE $USER@$SERVER:$REMOTE_DIR/.env

# 4. Build et lancement
echo "🏗️  Build et démarrage des containers..."
ssh $USER@$SERVER "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml up -d --build"

# 5. Attendre le healthcheck
echo "⏳ Attente du healthcheck..."
sleep 15

# 6. Vérification
echo "✅ Vérification..."
ssh $USER@$SERVER "docker ps --filter 'name=pins' --format '{{.Names}}: {{.Status}}'"

STATUS=$(ssh $USER@$SERVER "curl -s http://localhost/api/health 2>/dev/null | grep -o '\"status\":\"ok\"'" || true)
if [ -n "$STATUS" ]; then
    echo ""
    echo "✅ Déploiement réussi !"
    echo "   Application : http://$SERVER"
    echo "   API Health  : http://$SERVER/api/health"
else
    echo ""
    echo "⚠️  L'application ne répond pas encore. Vérifiez les logs :"
    echo "   ssh $USER@$SERVER 'docker logs pins-api'"
fi

echo ""
echo "============================================"
echo "🎉 Déploiement terminé"
