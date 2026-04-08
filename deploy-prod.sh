#!/bin/bash
set -e
cd /opt/dpi-interop

echo "=== 1. Pull latest code ==="
git pull origin main || { echo "FAIL: git pull"; exit 1; }

echo "=== 2. Create .env ==="
echo 'NODE_ENV=production' > backend/.env
echo 'HOST=0.0.0.0' >> backend/.env
echo 'PORT=3000' >> backend/.env
echo 'DATABASE_URL=postgresql://dpiuser:iE3Occp0n0CCSmY@172.17.0.1:5432/dpidb?schema=public' >> backend/.env
echo 'JWT_SECRET=changeme64charsminimumforproductionsecuritykey1234567890abcdef' >> backend/.env
echo 'JWT_EXPIRES_IN=24h' >> backend/.env
echo 'CORS_ORIGIN=https://dpi-interop.sec.gouv.sn' >> backend/.env
echo 'RATE_LIMIT_MAX=200' >> backend/.env
echo 'RATE_LIMIT_TIMEWINDOW=60000' >> backend/.env
echo 'LOG_LEVEL=info' >> backend/.env

echo "=== 3. Ensure PostgreSQL ==="
if docker ps --format '{{.Names}}' | grep -q pins-db; then
  echo "pins-db running"
else
  docker rm -f pins-db 2>/dev/null || true
  docker run -d --name pins-db \
    -e POSTGRES_USER=dpiuser \
    -e POSTGRES_PASSWORD=iE3Occp0n0CCSmY \
    -e POSTGRES_DB=dpidb \
    -p 5432:5432 \
    --restart always \
    postgres:15-alpine
  sleep 5
fi
docker exec pins-db pg_isready -U dpiuser || { echo "FAIL: DB not ready"; exit 1; }

echo "=== 4. Network ==="
docker network create pins-net 2>/dev/null || true
docker network connect pins-net pins-db 2>/dev/null || true

echo "=== 5. Build ==="
docker compose -f docker-compose.prod.yml build backend frontend
echo "Build OK"

echo "=== 6. Backend ==="
docker rm -f pins-api 2>/dev/null || true
docker run -d --name pins-api \
  --network pins-net \
  --env-file backend/.env \
  --restart always \
  dpi-interop-backend

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
docker exec pins-api sh -c "npx prisma migrate deploy" || echo "Migration skipped"

echo "=== 8. Frontend ==="
docker rm -f pins-frontend 2>/dev/null || true
docker run -d --name pins-frontend \
  --network pins-net \
  -p 80:80 \
  --restart always \
  dpi-interop-frontend

sleep 5
docker ps --format '{{.Names}}' | grep -q pins-frontend || { echo "FAIL: Frontend"; docker logs pins-frontend --tail 10; exit 1; }
curl -sf http://localhost/ > /dev/null || { echo "FAIL: Not serving"; exit 1; }

echo ""
echo "=== DEPLOYMENT SUCCESSFUL ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
