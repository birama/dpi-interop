#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

# Seed on first run (if no users exist)
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "First run — seeding database..."
  npx prisma db seed || echo "Seed skipped"
fi

echo "Starting server..."
exec node dist/server.js
