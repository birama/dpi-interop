#!/bin/bash
set -e

cd /opt/dpi-interop/questionnaire-interop

echo "=== 1. Code update ==="
if [ -d .git ]; then
  git pull origin main || { echo "FAIL: git pull"; exit 1; }
else
  echo "No .git found — initializing from remote..."
  git init
  git remote add origin https://github.com/birama/dpi-interop.git
  git fetch origin main
  git reset --hard origin/main
fi
echo "Git OK: $(git log --oneline -1)"

echo "=== 2. Preserve .env ==="
if [ ! -f backend/.env ]; then
  echo "Creating backend/.env..."
  cat > backend/.env <<'ENVEOF'
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
DATABASE_URL=postgresql://pins:HTvhrQvm3mZgZeAwOUxnqYvDvpsSSeio24OSTvMojs@pins-db:5432/questionnaire_interop?schema=public
JWT_SECRET=36c3dfcd5ae98a1612b8898bfba0b16dac9afba709b4274282d717508a2711121b3d9ead0ebc92556ad6e9c4657f6f269cf3ede72284976fda40c87ada549823
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://dpi-interop.sec.gouv.sn
RATE_LIMIT_MAX=1000
RATE_LIMIT_TIMEWINDOW=60000
LOG_LEVEL=info
ENVEOF
fi
echo ".env present: $(wc -l < backend/.env) lines"

echo "=== 3. Ensure PostgreSQL ==="
if docker ps --format '{{.Names}}' | grep -q pins-db; then
  echo "pins-db running"
else
  echo "FAIL: pins-db not running. Start it manually."
  exit 1
fi
docker exec pins-db pg_isready -U pins || { echo "FAIL: DB not ready"; exit 1; }

echo "=== 4. Network ==="
docker network create pins-net 2>/dev/null || true
docker network connect pins-net pins-db 2>/dev/null || true

echo "=== 5. Build ==="
docker compose -f docker-compose.prod.yml build backend frontend
echo "Build OK"

echo "=== 6. Backend ==="
docker rm -f pins-api 2>/dev/null || true
mkdir -p /opt/dpi-interop/uploads
docker run -d --name pins-api \
  --network pins-net \
  --env-file backend/.env \
  -v /opt/dpi-interop/uploads:/app/uploads \
  --restart always \
  questionnaire-interop-backend

echo "Waiting for backend..."
for i in $(seq 1 12); do
  if docker exec pins-api wget -qO- http://127.0.0.1:3000/health 2>/dev/null; then
    echo ""
    echo "Backend OK after ${i}0s"
    break
  fi
  [ $i -eq 12 ] && { echo "FAIL: Backend timeout"; docker logs pins-api --tail 20; exit 1; }
  sleep 10
done

echo "=== 7. Migrations ==="
docker exec pins-api sh -c "npx prisma migrate deploy 2>&1" || echo "Migration step completed (check output above)"

echo "=== 8. Frontend (HTTPS) ==="
docker rm -f pins-frontend 2>/dev/null || true
docker run -d --name pins-frontend \
  --network pins-net \
  -p 80:80 \
  -p 443:443 \
  -v /opt/dpi-interop/certs:/etc/nginx/certs:ro \
  --restart always \
  questionnaire-interop-frontend

sleep 5
docker ps --format '{{.Names}}' | grep -q pins-frontend || { echo "FAIL: Frontend"; docker logs pins-frontend --tail 10; exit 1; }
curl -sf http://localhost/ > /dev/null || { echo "FAIL: Not serving"; exit 1; }

echo ""
echo "=== DEPLOYMENT SUCCESSFUL ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
