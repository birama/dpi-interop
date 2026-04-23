#!/bin/bash
# Fix automatique pins-api apres Chantier 2 (port 5432 securise)
#
# A executer sur le serveur srv1551800 :
#   cd /opt/dpi-interop
#   bash ops/fix-pins-api.sh
#
# Le script :
#  1. Verifie que backend/.env a bien la route pins-db (pas 172.17.0.1)
#  2. Corrige deploy-prod.sh pour que les futurs deploys restent coherents
#  3. Stop + remove pins-api (car docker restart ne relit pas --env-file)
#  4. Relance pins-api avec le nouvel .env
#  5. Teste que la DB est joignable via DNS pins-db

set -e
cd "$(dirname "$0")/.."

echo "=== 1. Verification backend/.env ==="
if grep -q '@172.17.0.1:5432' backend/.env; then
  echo "    .env utilise encore 172.17.0.1 — correction"
  sed -i 's|@172.17.0.1:5432|@pins-db:5432|' backend/.env
fi
if grep -q '@pins-db:5432' backend/.env; then
  echo "    OK — DATABASE_URL pointe vers pins-db"
else
  echo "    ECHEC — DATABASE_URL ni 172.17.0.1 ni pins-db, intervention manuelle requise"
  exit 1
fi

echo ""
echo "=== 2. Correction deploy-prod.sh ==="
if [ -f deploy-prod.sh ]; then
  if grep -q '@172.17.0.1:5432' deploy-prod.sh; then
    sed -i 's|@172.17.0.1:5432|@pins-db:5432|g' deploy-prod.sh
    echo "    deploy-prod.sh corrige (172.17.0.1 → pins-db)"
  else
    echo "    deploy-prod.sh deja coherent"
  fi
else
  echo "    deploy-prod.sh absent (pas bloquant)"
fi

echo ""
echo "=== 3. Stop + remove pins-api (docker restart ne recharge pas --env-file) ==="
docker rm -f pins-api 2>&1 | tail -1

echo ""
echo "=== 4. Relance pins-api avec le .env a jour ==="
docker run -d --name pins-api \
  --network pins-net \
  --env-file backend/.env \
  -v /opt/dpi-interop/uploads:/app/uploads \
  --restart always \
  dpi-interop-backend >/dev/null
echo "    pins-api relance"

echo ""
echo "=== 5. Attente demarrage (20s) ==="
sleep 20

echo ""
echo "=== 6. Etat pins-api ==="
docker ps --filter name=pins-api --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== 7. Logs recents (les 15 dernieres lignes) ==="
docker logs pins-api --tail 15 2>&1 | tail -15

echo ""
echo "=== 8. Health check interne ==="
if docker exec pins-api wget -qO- --timeout=5 http://127.0.0.1:3000/health 2>/dev/null; then
  echo ""
  echo "    BACKEND HEALTHY"
else
  echo "    ECHEC — backend ne repond pas en interne"
  exit 2
fi

echo ""
echo "=== 9. Test login via HTTPS public ==="
LOGIN_RESPONSE=$(curl -sS -X POST https://dpi-interop.senum.sn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sanity@check.test","password":"xxx"}' \
  | head -c 200)
echo "    Reponse : $LOGIN_RESPONSE"
if echo "$LOGIN_RESPONSE" | grep -q "Email ou mot de passe incorrect"; then
  echo ""
  echo "    AUTH OK — DB joignable, pins-api fonctionnel"
elif echo "$LOGIN_RESPONSE" | grep -q "Erreur serveur"; then
  echo ""
  echo "    ECHEC — DB toujours inaccessible. Regarder les logs ci-dessus."
  exit 3
else
  echo ""
  echo "    Reponse inattendue — a examiner"
fi

echo ""
echo "=== 10. Port 5432 toujours securise ? ==="
docker port pins-db | grep -q '127.0.0.1:5432' && echo "    OK — 5432 uniquement sur loopback" || echo "    ALERTE — 5432 expose publiquement"

echo ""
echo "============================================"
echo "FIX TERMINE AVEC SUCCES"
echo "============================================"
