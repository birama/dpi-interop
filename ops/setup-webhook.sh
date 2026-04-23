#!/bin/bash
# Installation du webhook auto-deploy DPI-INTEROP
#
# A executer UNE SEULE FOIS sur le serveur (sudo requis) :
#   cd /opt/dpi-interop
#   sudo bash ops/setup-webhook.sh

set -e

echo "=== Installation webhook auto-deploy DPI-INTEROP ==="

# 1. Verifier prerequis
if [ "$EUID" -ne 0 ]; then
  echo "ERREUR : sudo requis"
  exit 1
fi

if ! command -v python3 >/dev/null; then
  echo "Installation python3..."
  apt-get update && apt-get install -y python3
fi

# 2. Generer le secret webhook s'il n'existe pas
SECRET_FILE=/etc/dpi-webhook.env
if [ ! -f "$SECRET_FILE" ]; then
  SECRET=$(openssl rand -hex 32)
  cat > "$SECRET_FILE" <<EOF
WEBHOOK_SECRET=$SECRET
DEPLOY_SCRIPT=/opt/dpi-interop/deploy-prod.sh
LOG_FILE=/var/log/dpi-webhook.log
EOF
  chmod 600 "$SECRET_FILE"
  chown root:root "$SECRET_FILE"
  echo ""
  echo "========================================================"
  echo "SECRET WEBHOOK GENERE — A COPIER DANS GITHUB MAINTENANT"
  echo "========================================================"
  echo "$SECRET"
  echo "========================================================"
  echo ""
  echo "Configuration GitHub webhook :"
  echo "  URL     : https://github.com/birama/dpi-interop/settings/hooks/new"
  echo "  Payload : https://dpi-interop.senum.sn/webhook/deploy"
  echo "  Content : application/json"
  echo "  Secret  : [la valeur ci-dessus]"
  echo "  Events  : Just the push event"
  echo "  SSL     : Enable SSL verification"
  echo ""
  echo "Note ce secret maintenant, il ne sera plus affiche."
  read -p "Appuie sur Entree apres avoir colle le secret dans GitHub..."
else
  echo "Secret existant dans $SECRET_FILE — conserve"
fi

# 3. Preparer log file
touch /var/log/dpi-webhook.log
chown deploy:deploy /var/log/dpi-webhook.log
chmod 640 /var/log/dpi-webhook.log

# 4. Installer le service systemd
cp /opt/dpi-interop/ops/webhook-deploy.service /etc/systemd/system/dpi-webhook.service
systemctl daemon-reload
systemctl enable dpi-webhook.service
systemctl restart dpi-webhook.service

sleep 2
if systemctl is-active --quiet dpi-webhook.service; then
  echo "    Service dpi-webhook ACTIF"
else
  echo "    ECHEC demarrage service — diagnostic :"
  journalctl -u dpi-webhook --no-pager -n 20
  exit 2
fi

# 5. Test local
sleep 1
if curl -sf http://127.0.0.1:9000/health | grep -q "ok"; then
  echo "    Listener repond sur 127.0.0.1:9000"
else
  echo "    ECHEC — listener ne repond pas"
  exit 3
fi

# 6. Installation nginx upstream (ajout au container pins-frontend)
echo ""
echo "=== IMPORTANT : ajout location /webhook/ dans nginx ==="
echo "Il faut maintenant :"
echo "  1. Verifier que frontend/nginx.conf contient bien le bloc"
echo "     location /webhook/ (deja commit par Claude)"
echo "  2. Rebuild pins-frontend : docker compose -f docker-compose.prod.yml build frontend"
echo "  3. Redemarrer pins-frontend"
echo ""
echo "Ou utiliser le script complet : bash ops/install-webhook-nginx.sh"

echo ""
echo "=== Installation webhook TERMINEE ==="
systemctl status dpi-webhook --no-pager -n 5
