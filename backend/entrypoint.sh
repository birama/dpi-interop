#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy || echo "Migration skipped (already up to date)"

echo "Starting server..."
exec node dist/server.js
