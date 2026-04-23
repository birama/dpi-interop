#!/bin/bash
# Installation complete du webhook auto-deploy (listener + nginx proxy)
#
# A executer UNE SEULE FOIS sur le serveur :
#   cd /opt/dpi-interop
#   sudo bash ops/install-webhook-complete.sh
#
# Ce script :
#  1. Installe le service systemd dpi-webhook (listener Python sur 127.0.0.1:9000)
#  2. Genere un secret HMAC et l'affiche UNE SEULE FOIS
#  3. Rebuild le container pins-frontend avec --add-host=host.docker.internal:host-gateway
#     pour que nginx puisse joindre le listener
#  4. Teste le bout en bout

set -e

if [ "$EUID" -ne 0 ]; then
  echo "ERREUR : sudo requis"
  exit 1
fi

PROJECT_DIR=/opt/dpi-interop
cd "$PROJECT_DIR"

echo "=== Etape 1/5 : Dependances systeme ==="
apt-get update -qq
apt-get install -y -qq python3 openssl curl

echo ""
echo "=== Etape 2/5 : Secret webhook + service systemd ==="
SECRET_FILE=/etc/dpi-webhook.env
if [ ! -f "$SECRET_FILE" ]; then
  SECRET=$(openssl rand -hex 32)
  cat > "$SECRET_FILE" <<EOF
WEBHOOK_SECRET=$SECRET
DEPLOY_SCRIPT=$PROJECT_DIR/deploy-prod.sh
LOG_FILE=/var/log/dpi-webhook.log
EOF
  chmod 600 "$SECRET_FILE"

  echo ""
  echo "+--------------------------------------------------------+"
  echo "| SECRET WEBHOOK — A CONFIGURER DANS GITHUB MAINTENANT   |"
  echo "+--------------------------------------------------------+"
  echo "$SECRET"
  echo "+--------------------------------------------------------+"
  echo ""
  echo "Configuration GitHub webhook :"
  echo "  URL repo      : https://github.com/birama/dpi-interop/settings/hooks/new"
  echo "  Payload URL   : https://dpi-interop.senum.sn/webhook/deploy"
  echo "  Content type  : application/json"
  echo "  Secret        : [la valeur ci-dessus]"
  echo "  Events        : Just the push event"
  echo "  Active        : coche"
  echo "  SSL verif     : Enable"
  echo ""
  read -p "Appuie sur Entree APRES avoir cree le webhook dans GitHub..."
else
  echo "    Secret existant conserve ($SECRET_FILE)"
fi

# Log file
touch /var/log/dpi-webhook.log
chown deploy:deploy /var/log/dpi-webhook.log
chmod 640 /var/log/dpi-webhook.log

# Service systemd
cp $PROJECT_DIR/ops/webhook-deploy.service /etc/systemd/system/dpi-webhook.service
systemctl daemon-reload
systemctl enable dpi-webhook.service
systemctl restart dpi-webhook.service

sleep 3
if systemctl is-active --quiet dpi-webhook.service; then
  echo "    Service dpi-webhook ACTIF"
else
  echo "    ECHEC demarrage service :"
  journalctl -u dpi-webhook --no-pager -n 20
  exit 2
fi

if curl -sf http://127.0.0.1:9000/health | grep -q "ok"; then
  echo "    Listener repond sur 127.0.0.1:9000/health"
else
  echo "    ECHEC — listener ne repond pas en local"
  exit 3
fi

echo ""
echo "=== Etape 3/5 : Rebuild pins-frontend avec nginx mis a jour ==="
docker compose -f docker-compose.prod.yml build frontend

echo ""
echo "=== Etape 4/5 : Recrée pins-frontend avec --add-host ==="

# Recupere les bindings actuels de pins-frontend pour les conserver
docker rm -f pins-frontend 2>/dev/null || true

docker run -d --name pins-frontend \
  --network pins-net \
  --add-host=host.docker.internal:host-gateway \
  -p 80:80 -p 443:443 \
  -v /etc/letsencrypt/live/dpi-interop.senum.sn:/etc/letsencrypt/live/dpi-interop.senum.sn:ro \
  -v /etc/letsencrypt/archive/dpi-interop.senum.sn:/etc/letsencrypt/archive/dpi-interop.senum.sn:ro \
  --restart always \
  dpi-interop-frontend

sleep 3
if docker ps --format '{{.Names}}' | grep -q '^pins-frontend$'; then
  echo "    pins-frontend lance avec --add-host"
else
  echo "    ECHEC pins-frontend :"
  docker logs pins-frontend --tail 10
  exit 4
fi

echo ""
echo "=== Etape 5/5 : Test bout en bout ==="

# Test que nginx peut joindre le listener via host.docker.internal
echo "  a. nginx → listener via host.docker.internal..."
if docker exec pins-frontend wget -qO- --timeout=5 http://host.docker.internal:9000/health 2>/dev/null | grep -q "ok"; then
  echo "     OK — nginx peut joindre le listener"
else
  echo "     ECHEC — nginx ne voit pas le listener"
  exit 5
fi

# Test que le webhook est accessible en HTTPS
echo "  b. Webhook accessible via HTTPS..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://dpi-interop.senum.sn/webhook/health)
if [ "$HTTP_CODE" = "200" ]; then
  echo "     OK — /webhook/health renvoie 200"
else
  echo "     Code recu : $HTTP_CODE (attendu 200)"
fi

# Test que le POST sans signature est refuse
echo "  c. POST sans signature est rejete (401)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://dpi-interop.senum.sn/webhook/deploy \
  -H "Content-Type: application/json" -d '{"test":1}')
if [ "$HTTP_CODE" = "401" ]; then
  echo "     OK — signature invalide rejetee"
else
  echo "     Code recu : $HTTP_CODE (attendu 401)"
fi

echo ""
echo "+========================================================+"
echo "| INSTALLATION WEBHOOK TERMINEE                          |"
echo "+========================================================+"
echo ""
echo "Test final : depuis GitHub Settings → Webhooks → ton webhook,"
echo "clique 'Redeliver' sur un ping existant OU fais un git push."
echo ""
echo "Suivre les logs :"
echo "  journalctl -u dpi-webhook -f"
echo "  tail -f /var/log/dpi-webhook.log"
echo ""
systemctl status dpi-webhook --no-pager -n 3
