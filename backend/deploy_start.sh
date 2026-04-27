#!/bin/sh
set -e

echo "--- SENIOR DEPLOYMENT STARTING ---"

# 1. Wait for Database
until nc -z db 3306; do
  echo "Waiting for MySQL (db:3306)..."
  sleep 3
done

echo "Database detected! Waiting 10s for initialization..."
sleep 10

# 2. Generate Prisma Client (Doing it here bypasses build-time limits)
echo "Generating Prisma Client from /schema_config/prod.prisma..."
npx prisma generate --schema=./schema_config/prod.prisma

# 3. Sync Database
echo "Syncing database schema..."
npx prisma db push --accept-data-loss --schema=./schema_config/prod.prisma

# 4. Start Server
echo "Launching Influenzia API..."
exec node src/app.js
